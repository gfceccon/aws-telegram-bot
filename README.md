# aws-telegram-bot

.env
CARDINFO_URL=""
ACCESS_KEY=""
SECREAT_KEY=""
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

aws s3 mb s3://ygotcg-telegram-bot-bucket

aws cloudformation package --template-file template.yml --s3-bucket ygotcg-telegram-bot-bucket --output-template-file out.yml

aws cloudformation deploy --template-file out.yml --stack-name telegram-bot --parameter-overrides file://config.json --capabilities CAPABILITY_NAMED_IAM

npm run start