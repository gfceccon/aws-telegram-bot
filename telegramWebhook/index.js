// const AWSXRay = require('aws-xray-sdk-core')
// const AWS = AWSXRay.captureAWS(require('aws-sdk'))

// // Create client outside of handler to reuse
// const lambda = new AWS.Lambda()

var serialize = function (object) {
  return JSON.stringify(object, null, 2);
};

// Handler
exports.handler = async function (event, context) {
  // event.Records.forEach(record => {
  //   console.log(record.body)
  // })
  console.log("## ENVIRONMENT VARIABLES: " + serialize(process.env));
  console.log("## CONTEXT: " + serialize(context));
  console.log("## EVENT: " + serialize(event));

  return {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
};
