import https from "https";

// Handler
exports.handler = async function (event: any, context: any) {
  const path = "/sendMessage";
  const host = `api.telegram.org/bot${process.env.BOT_TOKEN}`;
  const httpsOption = {
    hostname: host,
    port: 443,
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };

  const chatId = event.body.message.chat.chat_id;
  const text = "test";
  const replyId = event.body.message.message_id

  const message = {
    "chat_id": chatId,
    "text": text,
    "reply_to_message_id": replyId
  }

  const req = https.request(httpsOption);
  req.on("error", (error) => {
    console.log(error);
  });
  req.write(JSON.stringify(message));
  req.end();

  return {
    statusCode: 200,
    body: JSON.stringify(message),
  };
};
