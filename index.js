const {Cluster}=require('puppeteer-cluster');
const fs=require('fs');
const { execPath } = require('process');

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
for (let i = 1; i <= 10; i++) {
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
  fs.writeFileSync('stackoverflow_questions.json', JSON.stringify(final_data));

  // converting the json file to csv file
  const json2csvParser = require('json2csv').Parser;
  const fields = ['question_id', 'question_text', 'question_link', 'vote_count', 'views', 'answers'];
  const json2csv = new json2csvParser({
      fields
  });
  const csv = json2csv.parse(final_data);
  fs.writeFileSync('stackoverflow_questions.csv', csv);
})();