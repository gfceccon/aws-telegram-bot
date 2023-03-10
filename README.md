# YGO TCG Cards Telegram Bot w/ AWS
This is a Telegram bot built with AWS stack, using Lambda functions, DynamoDB and SQS. 
First, the client get the card from an API, send to a SQS queue. The SQS triggers a lambda function that updates the DynamoDB database. Finally, another Lambda function acts as a webhook for the Telegram API.

# AWS Requirements
You need an AWS account and setup an user with enough permissions to:
* Create a S3 bucket for the stack
* Create a Cloudformation stack
* Create, read and write SQS
* Create, read and write Lambda
* Create, read and write the DynamoDB tables
You must create an Access Key and Secret Key

# Client
To setup the client, 

.env
CARDINFO_URL=""
ACCESS_KEY=""
SECRET_KEY=""
REGION=""
QUEUE_URL=""

config.json
[
    {
         "ParameterKey": "ygoTcgTableName",
         "ParameterValue": ""
     },
     {
         "ParameterKey": "userId",
         "ParameterValue": ""
     },
     {
         "ParameterKey": "botName",
         "ParameterValue": ""
     },
     {
         "ParameterKey": "botToken",
         "ParameterValue": ""
     }
 ]

npm run build

cd layer
rm lib/
rm node_modules/
npm install --production
mkdir lib/nodejs/
move node_modules lib/nodejs/
cd ..

aws s3 mb s3://ygotcg-telegram-bot-bucket

aws cloudformation package --template-file template.yml --s3-bucket ygotcg-telegram-bot-bucket --output-template-file out.yml

aws cloudformation deploy --template-file out.yml --stack-name telegram-bot --parameter-overrides file://config.json --capabilities CAPABILITY_NAMED_IAM

npm run start