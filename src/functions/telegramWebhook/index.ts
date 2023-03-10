import request from "request";
import {
  DynamoDBClient,
  ScanCommand,
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
  const REGION = process.env.REGION;

  const updateMessage = JSON.parse(event.body) as Telegram.Update;
  if (!updateMessage.message) return;

  const messageText = updateMessage.message.text;
  if (!messageText) return;

  const chatId = updateMessage.message.chat.id;
  const replyId = updateMessage.message.message_id;
  let text = "Command not found, use /card to get a random card";

  let commands: { [key: string]: string } = {};
  if (updateMessage.message.entities) {
    commands = updateMessage.message.entities
      .filter((entity) => entity.type == "bot_command")
      .map((entity) =>
        messageText.substring(entity.offset, entity.offset + entity.length)
      )
      .reduce((a, v) => ({ ...a, [v]: v }), {});
  }

  let tempText = messageText;
  Object.keys(commands).forEach(
    (command) => (tempText = tempText.replace(command, ""))
  );

  const noCommands = tempText;

  if (
    commands["/card"] != undefined ||
    commands[`/card@${BOT_NAME}`] != undefined
  ) {
    const db = new DynamoDBClient({ region: `${REGION}` });
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

    if (
      variables.Responses &&
      variables.Responses[`${VARIABLES_TABLE_NAME}`] &&
      variables.Responses[`${VARIABLES_TABLE_NAME}`].length >= 2
    ) {
      minCardIdDb =
        variables.Responses[`${VARIABLES_TABLE_NAME}`][0]["value"] || null;
      maxCardIdDb =
        variables.Responses[`${VARIABLES_TABLE_NAME}`][1]["value"] || null;
    }

    const maxKey = 1000000;
    let key = randomInt(maxKey);
    if (minCardIdDb && minCardIdDb.S && maxCardIdDb && maxCardIdDb.S) {
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
      const cardAttack = card["atk"].N || "";
      const cardDefense = card["def"].N || "";
      const cardLevel = card["level"].N || "";
      const cardAttribute = card["attribute"].S || "";
      const cardArchetype = card["archetype"].S || "";
      const cardScale = card["scale"].S || "";
      const cardLink = card["link"].S || "";
      const cardLinkMarkers = card["linkMarkers"].SS || [];
      const cardSets = card["cardSets"].SS || [];
      const cardImages = card["cardImages"].SS || [];

      const tuner = cardType.indexOf("Tuner") > -1 ? true : false;
      let type = "";
      let level = "";

      if (cardType.indexOf("Monster") > -1) {
        level = `Level ${cardLevel}`;

        if (cardType.indexOf("Normal") > -1) {
          type = "NORMAL_MONSTER";
        } else {
          type = "EFFECT_MONSTER";
        }

        if (cardType.indexOf("Synchro") > -1) {
          type = "SYNCHRO_MONSTER";
          level = `Synchro ${cardLevel}`;
        }

        if (cardType.indexOf("Xyz") > -1) {
          type = "XYZ_MONSTER";
          level = `Rank ${cardLevel}`;
        }

        if (cardType.indexOf("Pendulum") > -1) {
          type = "PENDULUM_MONSTER";
          level = `Pendulum ${cardLevel} | Scale ${cardScale}`;
        }

        if (cardType.indexOf("Link") > -1) {
          type = "LINK_MONSTER";
          let arrows = cardLinkMarkers
            .filter((link) => link.length > 0)
            .map((marker) => marker.toUpperCase())
            .join(" | ");
          level = `Link ${cardLink} | ${arrows}`;
        }
      }

      text = "";
      text = text.concat("*" + cardName + "*");
      text = text.concat("\n");


      if (cardType.indexOf("Monster") > -1) {
        text = text.concat(cardType);
        text = text.concat("\n");
        text = text.concat(`${cardRace} ${cardAttribute}`);
        text = text.concat("\n");
      } else {
          text = text.concat(`${cardRace} ${cardType}`);
          text = text.concat("\n");
      }

      if (level.length > 0) {
        if (tuner) text = text.concat("Tuner ");
        text = text.concat(level);
        text = text.concat("\n");
      }

      switch (type) {
        case "NORMAL_MONSTER":
        case "EFFECT_MONSTER":
        case "SYNCHRO_MONSTER":
        case "XYZ_MONSTER":
        case "PENDULUM_MONSTER":
          text = text.concat(
            "Attack *" + cardAttack + "* / Defense *" + cardDefense + "*"
          );
          text = text.concat("\n");
          break;
        case "LINK_MONSTER":
          text = text.concat("Attack *" + cardAttack + "*");
          text = text.concat("\n");
          break;
      }

      text = text.concat("_" + cardDescription + "_");

      text = text.replace("-", "\-").replace("[", "\[").replace("]", "\]");

      let images = cardImages.filter((img) => img.length > 0);
      if (images.length > 0) {
        text = text.concat("\n");
        text = text.concat("\n");
        text = text.concat(`[Image](${images[0]})`);
      }
    }
  }

  const sendMessage: Telegram.SendMessage = {
    chat_id: chatId,
    text: text,
    reply_to_message_id: replyId,
    parse_mode: "Markdown",
  };

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  let sendTelegramMessage = () => {
    return new Promise((resolve, reject) => {
      request(
        url,
        {
          json: true,
          method: "POST",
          body: sendMessage,
        },
        (error, response, body) => {
          if (error) {
            reject(error);
          }
          if (response.statusCode != 200) {
            reject(response);
          }
          resolve(body);
        }
      );
    });
  };

  await sendTelegramMessage()
    .then((body) => {})
    .catch((error) => {
      console.log(error);
    });

  return {
    statusCode: 200,
    body: JSON.stringify(sendMessage),
  };
};
