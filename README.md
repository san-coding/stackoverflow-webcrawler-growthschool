# stackoverflow-webcrawler-growthschool
- Webscraper that crawls stackoverflow questions and exports to csv, json and stores the data in mongoDB.
- This is the submission for Growthschool backend internship assignment.

## Functionalities
- Asynchronous crawler
- Maintains a concurrency of 5 requests at all times using `puppeteer-cluster`
- Stores question_id, question_text, question_link, vote_count, views, answers_count.
- Exports the data to json and csv file.
- Stores the data to `mongoDB` atlas cluster hosted on AWS

