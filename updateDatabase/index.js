// const AWSXRay = require('aws-xray-sdk-core')
// const AWS = AWSXRay.captureAWS(require('aws-sdk'))

// // Create client outside of handler to reuse
// const lambda = new AWS.Lambda()
// const AWS = require('aws-sdk');
// import '@aws-sdk/types';
const {DynamoDBClient, BatchWriteItemCommand} = require('@aws-sdk/client-dynamodb');

var serialize = function (object) {
  return JSON.stringify(object, null, 2);
};

// Handler
exports.handler = async function (event, context) {
  // event.Records.forEach(record => {
  //   console.log(record.body)
  // })
  const db = new DynamoDBClient({region: 'us-east-2'});

  return {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
};
