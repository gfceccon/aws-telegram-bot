# aws-telegram-bot


aws s3 mb s3://ygotcg-telegram-bot-bucket --profile lambda-sso2p

mkdir lib/nodejs
rm node_modules
rm lib/nodejs/node_modules
npm install --production
mv node_modules lib/nodejs/

aws cloudformation package --template-file template.yml --s3-bucket ygotcg-telegram-bot-bucket --output-template-file out.yml --profile lambda-sso2p
aws cloudformation deploy --template-file out.yml --stack-name telegram-bot --capabilities CAPABILITY_NAMED_IAM --profile lambda-sso2p


https://api.telegram.org/botTOKEN/sendMessage

URL
https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#principal-roles
https://dynobase.dev/dynamodb-sqs/
https://github.com/aws/aws-sdk-js-v3
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-generated-resources-function.html
https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html
https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html
https://www.itonaut.com/2018/07/11/sqs-queue-as-lambda-trigger-in-aws-cloudformation/
https://medium.com/towards-data-engineering/sqs-lambda-triggers-cloudformation-template-900999a01de5
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SampleData.LoadData.html
https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html#eventsources-sqs
https://docs.aws.amazon.com/lambda/latest/dg/with-sqs-create-package.html
https://aws.amazon.com/about-aws/whats-new/2019/11/aws-lambda-supports-destinations-for-asynchronous-invocations/