# stackoverflow-webcrawler-growthschool
- Webscraper that crawls stackoverflow questions and exports to csv, json and stores the data in mongoDB.
- This is the submission for Growthschool backend internship assignment.

## Functionalities
- Asynchronous crawler
- Maintains a concurrency of 5 requests at all times using `puppeteer-cluster`
- Stores question_id, question_text, question_link, vote_count, views, answers_count.
- Exports the data to json and csv file.
- Stores the data to `mongoDB` atlas cluster hosted on AWS

## Output screenshots
### Data extracted and exported to csv, json.
<img width="1440" alt="Screenshot 2022-02-02 at 1 42 14 PM" src="https://user-images.githubusercontent.com/65719940/152117119-aba20345-cb3d-4b2e-a998-53f95b6a193f.png">

### Data stored in `MongoDB` atlas cluster hosted on AWS.
![image](https://user-images.githubusercontent.com/65719940/152117593-2412589f-8a7f-4d27-a2b5-8193af52de98.png)





