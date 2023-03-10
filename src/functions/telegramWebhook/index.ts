import https from "https";
import {
  DynamoDBClient,
  BatchWriteItemCommand,
  WriteRequest,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  ScanCommandOutput,
  AttributeValue,
  BatchGetItemCommand,
  KeysAndAttributes,
} from "@aws-sdk/client-dynamodb";
import { Telegram } from "./telegram";
import { randomInt } from "crypto";

exports.handler = async function (event: any, context: any) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const BOT_NAME = process.env.BOT_NAME;
  const TABLE_NAME = process.env.TABLE_NAME;
  const VARIABLES_TABLE_NAME = process.env.VARIABLES_TABLE_NAME;

  const path = "/sendMessage";
  const host = `api.telegram.org/bot${BOT_TOKEN}`;
  const httpsOption = {
    hostname: host,
    port: 443,
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const updateMessage = JSON.parse(event.body) as Telegram.Update;
  if (!updateMessage.message) return;

  const messageText = updateMessage.message.text;
  if (!messageText) return;

  const chatId = updateMessage.message.chat.id;
  const replyId = updateMessage.message.message_id;

  console.log("IDS", messageText, chatId, replyId);

  let commands: { [key: string]: string } = {};
  if (updateMessage.message.entities) {
    commands = updateMessage.message.entities
      .filter((entity) => entity.type == "bot_command")
      .map((entity) =>
        messageText.substring(entity.offset, entity.offset + entity.length)
      )
      .reduce((a, v) => ({ ...a, [v]: v }), {});
  }
  console.log("COMMANDS", commands);
  let tempText = messageText;
  Object.keys(commands).forEach(
    (command) => (tempText = tempText.replace(command, ""))
  );
  console.log("NO COMMANDS", tempText);
  const noCommands = tempText;
  let text = "Command not found, use /card <card name> to search for a card";

  if (commands["/card"] || commands[`/card@${BOT_NAME}`]) {
    const db = new DynamoDBClient({ region: "us-east-2" });
    
    const readBatch: Record<string, KeysAndAttributes> = {};
    readBatch[`${VARIABLES_TABLE_NAME}`] = {
      Keys: [{ id: { S: "MIN_CARD_ID" } }, { id: { S: "MAX_CARD_ID" } }],
    };

    const variables = await db.send(
      new BatchGetItemCommand({
        RequestItems: readBatch,
      })
    );
    let minCardIdDb = null;
    let maxCardIdDb = null;

    if (variables.Responses && variables.Responses[`${VARIABLES_TABLE_NAME}`] && variables.Responses[`${VARIABLES_TABLE_NAME}`].length >= 2) {
      minCardIdDb = variables.Responses[`${VARIABLES_TABLE_NAME}`][0]["value"] || null;
      maxCardIdDb = variables.Responses[`${VARIABLES_TABLE_NAME}`][1]["value"] || null;
    }

    // let key = "0";
    // let results: ScanCommandOutput;
    // do {
    //   results = await db.send(
    //     new ScanCommand({
    //       TableName: `${TABLE_NAME}`,
    //       Select: "ALL_ATTRIBUTES",
    //       FilterExpression: "contains(name, :name)",
    //       ExclusiveStartKey: {
    //         id: { N: key },
    //       },
    //       ExpressionAttributeValues: {
    //         ":name": { S: `${noCommands}` },
    //       },
    //       Limit: 100,
    //     })
    //   );
    //   if (!results.LastEvaluatedKey) break;
    //   if (!results.LastEvaluatedKey["id"].N) break;
    //   key = results.LastEvaluatedKey["id"].N;

    //   if (!results.Items) break;
    //   allResults = [...allResults, ...results.Items];
    // } while (results.Items?.length || results.LastEvaluatedKey);

    const maxKey = 1000000;
    let key = randomInt(maxKey);
    if(minCardIdDb && minCardIdDb.S && maxCardIdDb && maxCardIdDb.S) {
      key = randomInt(parseInt(minCardIdDb.S) - 1, parseInt(maxCardIdDb.S) - 1);
    }

    const results = await db.send(
      new ScanCommand({
        TableName: `${TABLE_NAME}`,
        Select: "ALL_ATTRIBUTES",
        ExclusiveStartKey: {
          id: { N: key.toString() },
        },
        Limit: 1,
      })
    );
    
    const cardItems = results.Items || [];

    if (cardItems.length > 0) {
      const card = cardItems[0];
      const cardId = card["id"].N || "";
      const cardName = card["name"].S || "";
      const cardType = card["type"].S || "";
      const cardDescription = card["desc"].S || "";
      const cardRace = card["race"].S || "";
      const cardAttack = card["atk"].S || "";
      const cardDefense = card["def"].S || "";
      const cardLevel = card["level"].S || "";
      const cardAttribute = card["attribute"].S || "";
      const cardArchetype = card["archetype"].S || "";
      const cardScale = card["scale"].S || "";
      const cardLink = card["link"].S || "";
      const cardLinkMarkers = card["linkMarkers"].SS || [];
      const cardSets = card["cardSets"].SS || [];
      const cardImages = card["cardImages"].SS || [];

      let type = "";
      const tuner = cardType.indexOf("Tuner") > -1 ? true : false;

      if (cardType.indexOf("Monster") > -1) {
        if (cardType.indexOf("Normal") > -1) type = "NORMAL_MONSTER";
        else type = "EFFECT_MONSTER";

        if (type.indexOf("Synchro") > -1) type = "SYNCHRO_MONSTER";

        if (type.indexOf("Xyz") > -1) type = "XYZ_MONSTER";

        if (type.indexOf("Pendulum") > -1) type = "PENDULUM_MONSTER";

        if (type.indexOf("Link") > -1) type = "LINK_MONSTER";
      }

      let text = "";
      text.concat("*" + cardName + "*");
      text.concat("\n");

      if (cardType.length > 0) {
        text.concat(cardType);
        if (cardAttribute.length > 0) text.concat("\n");
      }
      if (cardRace.length > 0) {
        text.concat(cardRace);
      }
      if (cardAttribute.length > 0) {
        text.concat(" " + cardAttribute);
        text.concat("\n");
      }
      if (cardLevel.length > 0) {
        if (tuner) text.concat("Tuner ");
        text.concat(cardLevel);
        text.concat("\n");
      }
      switch (type) {
        case "NORMAL_MONSTER":
        case "EFFECT_MONSTER":
        case "SYNCHRO_MONSTER":
        case "XYZ_MONSTER":
        case "PENDULUM_MONSTER":
          text.concat(
            "Attack *" + cardAttack + "* / Defense *" + cardDefense + "*"
          );
          text.concat("\n");
          break;
        case "LINK_MONSTER":
          text.concat("Attack *" + cardAttack + "*");
          text.concat("\n");
          break;
      }
      text.concat("\n");
      text.concat("_" + cardDescription + "_");

      if (cardImages.length > 0) {
        text.concat("\n");
        text.concat("\n");
        text.concat(cardImages[0]);
      }
    }
  }

  const sendMessage: Telegram.SendMessage = {
    chat_id: chatId,
    text: text,
    reply_to_message_id: replyId,
  };

  const req = https.request(httpsOption);
  req.on("error", (error) => {
    console.log(error);
  });
  req.write(JSON.stringify(sendMessage));
  req.end();

  return {
    statusCode: 200,
    body: JSON.stringify(sendMessage),
  };
};
