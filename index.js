/**
 * Author:      Sandeep Rajakrishnan (sandur43@gmail.com)
 * Created:     02.02.2022
 * 
 * Description: Code asynchronously crawls through the latest questions on Stackoverflow and scrapes 
 *              the question_id, question_text, question_link, vote_count, views, answers_count while
 *              maintaining a concurrency of 5 requests.
 *              The data is then exported to a json and csv file and stored in mongoDB database.
 *              This is part of growthschool backend internship assignment.
 **/

 const {Cluster}=require('puppeteer-cluster');
 const fs=require('fs');
 const mongoose=require('mongoose');
 const process = require('process');
 require('dotenv').config();
 
 
 
 // Defining class for stackoverflow questions using es6
 class stackoverflow_question {
   constructor(question_id, question_text, question_link, vote_count, views, answers) {
       this.question_id = question_id;
       this.question_text = question_text;
       this.question_link = question_link;
       this.vote_count = vote_count;
       this.views = views;
       this.answers = answers;
   }
 }
 
 // storing urls of first n stackoverflow question pages
 const urls = [];
 const n=5; // number of pages to be scraped
 for (let i = 1; i <= n; i++) {
   urls.push(`https://stackoverflow.com/questions?tab=newest&page=${i}`);
 }
 
 // declaring list which will contain objects of stackoverflow_question class
 const final_data = [];
 
 // async function to get data from each url, concurrency of 5 urls is maintained
 (async () => {
   console.log('starting')
   const cluster = await Cluster.launch({
       concurrency: Cluster.CONCURRENCY_PAGE,
       maxConcurrency: 5,
   });
 
   // Defining the task to be executed for the data
   await cluster.task(async ({
       page,
       data: url
   }) => {
       await page.goto(url);
 
       // web scraping the below fields for each question
       const questions = await page.$$eval('div.question-summary', questions => {
           return questions.map(question => {
 
               // extracting a unique question number/id of for the question
               const question_id = question.querySelector('.question-hyperlink').href.split('/')[4];
 
               // removed punctuation from question_text because commas will affect the csv file 
               const question_text = question.querySelector('.question-hyperlink').innerText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
 
               const question_link = question.querySelector('.question-hyperlink').href;
               const vote_count = question.querySelector('.vote-count-post').innerText;
 
               // extracting the "number" of views for the question
               const views = question.querySelector('.views').innerText.replace(/[^0-9]/g, '').trim();
 
               // extracting the "number" of answers for the question
               const answers = question.querySelector('.status').innerText.replace(/[^0-9]/g, '').trim();
 
               return {
                   question_id,
                   question_text,
                   question_link,
                   vote_count,
                   views,
                   answers
               };
           })
       });
 
       // creating a new object for each question and pushing the object to the final_data array
       questions.forEach(element => {
           final_data.push(new stackoverflow_question(element.question_id, element.question_text, element.question_link, element.vote_count, element.views, element.answers));
       });
   });
 
   // adding urls to the cluster
   for (let url of urls) {
       await cluster.queue(url);
   }
 
   // closing the cluster after all the tasks are executed and data is stored in final_data array
   await cluster.idle();
   await cluster.close();
 
   console.log(final_data);
 
 
   // converting the final_data array to a json file
   fs.writeFileSync('exported_stackoverflow_questions.json', JSON.stringify(final_data));
 
 
   // converting the json file to csv file
   const json2csvParser = require('json2csv').Parser;
   const fields = ['question_id', 'question_text', 'question_link', 'vote_count', 'views', 'answers'];
   const json2csv = new json2csvParser({
       fields
   });
   const csv = json2csv.parse(final_data);
   fs.writeFileSync('exported_stackoverflow_questions.csv', csv);
 
   
   // connecting to mongodb atlas cluster hosted on AWS
   // Using environment variables to store and access mongodb credentials
   const dbURI = process.env.MONGO_URI;
   mongoose.connect(dbURI, {
           useNewUrlParser: true,
           useUnifiedTopology: true
       })
       .then(() => {
           console.log("connected to mongodb");
           // Definition of schema for mongodb
           const questionSchema = new mongoose.Schema({
               question_id: String,
               question_text: String,
               question_link: String,
               vote_count: String,
               views: String,
               answers: String
           });
           // creating a model for the schema
           const Question = mongoose.model('question', questionSchema);
           for (let i = 0; i < final_data.length; i++) {
               const question_data = new Question(final_data[i]);
               // checking if question_id is already present in database and storing only if it is not present
               Question.findOne({
                   question_id: question_data.question_id
               }, (err, data) => {
                   if (err) {
                       console.log(err);
                   } else if (data) {
                       // case where question_id is already present in database, so no need to store it again
                       console.log("question_id " + question_data.question_id + " already present in database");
                   } else {
                       // case where question_id is not present in database, hence storing the data
                       question_data.save();
                   }
               });
           }
           console.log("data saved to mongodb");
       })
       .catch(err => {
           console.log(err);
           // if error occurs, the cluster will close and exit the program
           cluster.close();
           process.exit(1);
       })
 })();
