# YGO TCG Cards Telegram Bot w/ AWS
This is a Telegram bot built with AWS stack, using Lambda functions, DynamoDB and SQS. 
First, the client get the card from an API, send to a SQS queue. The SQS triggers a Lambda function that updates the DynamoDB database. Finally, another Lambda function acts as a webhook for the Telegram API.

# AWS Requirements
You need an AWS account and setup an user with enough permissions to:
* Create a S3 bucket for the stack
* Create a Cloudformation stack
* Create, read and write SQS
* Create, read and write Lambda
* Create, read and write the DynamoDB tables

You must create an Access Key and Secret Key and get the User ID, it'll be used later for the SQS queue.

# Telegram
## Requirements
* Telegram bot

Create a bot account and create the bot token, see the Telegram API documentation for more informations.

# AWS Stack
## Requirements
* AWS CLI

First, create a file named `config.json` at the root folder, fill it with the enviornment variables you got from the AWS account and the Telgram bot.
```
[
    {
         "ParameterKey": "ygoTcgTableName",
         "ParameterValue": "ygoTcg"
     },
    {
         "ParameterKey": "variablesTableName",
         "ParameterValue": "variables"
     },
     {
         "ParameterKey": "userId",
         "ParameterValue": "<YOUR USER ID>"
     },
     {
         "ParameterKey": "botName",
         "ParameterValue": "<YOUR BOT NAME>"
     },
     {
         "ParameterKey": "botToken",
         "ParameterValue": "<YOUR BOT TOKEN>"
     }
 ]
```

You can change the table names from `ygoTcgTableName` and `variablesTableName`, but they must match the Node.js configuration file.

After login the AWS CLI, you need to create a bucket for the stack files.

`aws s3 mb s3://ygotcg-telegram-bot-bucket`

# Nodejs Setup
## Requirement
* Node.js

First, install the dependencies at the root folder and install the dependencies from the Lambda Layer at the /layer folder.

```
npm install
cd layer
rm lib/
rm node_modules/
npm install --production
mkdir lib/nodejs/
move node_modules lib/nodejs/
cd ..
```

Now, create the envirornment configuration file for the Nodejs client. Create a `.env` file at the root folder with the following configuration. The `CARDINFO_URL` is the API URL that will return the card information (see `cardinfo.json` for an example). The other variables are from AWS stack: account access and secret key; region; and SQS queue URL (which you don't have yet).
```
CARDINFO_URL=""
ACCESS_KEY=""
SECRET_KEY=""
REGION=""
QUEUE_URL=""
```

To build the project, run `npm run build`, it'll compile the Typescript files and put at the `build/` folder. To update the database, run `npm run start`, but don't run this until the AWS stack is built.

# AWS Stack Creation
First build the Typescript project, the built Javascript files will be used to create the Lambda functions.

`npm run build`

Prepare the stack for Cloudformation, it'll generate a new template file called out.yml.

`aws cloudformation package --template-file template.yml --s3-bucket ygotcg-telegram-bot-bucket --output-template-file out.yml`

Lastly, you need to deploy the template file to Cloudformation, passing the parameters using the configuration JSON we created.

`aws cloudformation deploy --template-file out.yml --stack-name telegram-bot --parameter-overrides file://config.json --capabilities CAPABILITY_NAMED_IAM`

# Running the Client
You need to run the client to populate the DynamoDB, but first fill the remaning client configuration `QUEUE_URL` with the SQS queue URL, then run the project.

`npm run start`

It should send the cards to the queue and update the min and max card ID on the variables database, which are used to get a random card.

# Conclusion
Set the bot webhook to the Lambda URL, check Telegram API documentation for more details.

Finally you can send `/card` to the Telegram bot and the application should return a random card from the database!
