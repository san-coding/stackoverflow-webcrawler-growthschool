const puppeteer=require('puppeteer');
const {Cluster}=require('puppeteer-cluster');
const fs=require('fs');
const { url } = require('inspector');



const urls=[];
for(let i=1;i<=2;i++){
    urls.push(`https://stackoverflow.com/questions?tab=newest&page=${i}`);
}
console.log(urls);

const final_data=[];

(async () => {
    console.log('starting')
    const cluster= await Cluster.launch({ 
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 5,
    });
    
      // Define a task to be executed for your data
  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);
    

    // inside div with id='questions' find all the divs with class='question-summary' , inside each of these divs find span with class='vote-count-post' and get the text, inside question-summary get the text inside the class='question-hyperlink' 
    const questions=await page.$$eval('div.question-summary',questions=>{
        return questions.map(question=>{
            const question_id=question.querySelector('.question-hyperlink').href.split('/')[4];
            const question_text=question.querySelector('.question-hyperlink').innerText;
            const question_link=question.querySelector('.question-hyperlink').href;
            const vote_count=question.querySelector('.vote-count-post').innerText;
            const views=question.querySelector('.views').innerText.replace('views','').trim();
            const answers=question.querySelector('.status').innerText.replace('\nanswers','').trim();
            return {question_id,question_text,question_link,vote_count,views,answers};
        })
    });

    
    final_data.push(...questions);
    // convert the data to a csv file with column names as keys and values as values
    const csv=final_data.map(({question_id,question_text,question_link,vote_count,views,answers})=>`${question_id},${question_text},${question_link},${vote_count},${views},${answers}`).join('\n');
    fs.writeFileSync('data.csv',csv);

    
    

  });
   for(let url of urls){
    await cluster.queue(url);
   }

    
    
      await cluster.idle();
      await cluster.close();

        console.log(final_data);



})();

console.log('done')















