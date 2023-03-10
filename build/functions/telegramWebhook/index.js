"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
exports.handler = function (event, context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const BOT_TOKEN = process.env.BOT_TOKEN;
        const BOT_NAME = process.env.BOT_NAME;
        const TABLE_NAME = process.env.TABLE_NAME;
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
        const updateMessage = event.body;
        if (!updateMessage.message)
            return;
        const messageText = updateMessage.message.text;
        if (!messageText)
            return;
        const chatId = updateMessage.message.chat.id;
        const replyId = updateMessage.message.message_id;
        let commands = {};
        if (updateMessage.message.entities) {
            commands = updateMessage.message.entities
                .filter((entity) => entity.type == "bot_command")
                .map((entity) => messageText.substring(entity.offset, entity.offset + entity.length))
                .reduce((a, v) => (Object.assign(Object.assign({}, a), { [v]: v })), {});
        }
        let tempText = messageText;
        Object.keys(commands).forEach((command) => (tempText = tempText.replace(command, "")));
        const noCommands = tempText;
        let text = "Command not found, use /card <card name> to search for a card";
        if (commands["/card"] || commands[`/card@${BOT_NAME}`]) {
            const db = new client_dynamodb_1.DynamoDBClient({ region: "us-east-2" });
            let allResults = [];
            let key = "0";
            let results;
            do {
                results = yield db.send(new client_dynamodb_1.ScanCommand({
                    TableName: `${TABLE_NAME}`,
                    Select: "ALL_ATTRIBUTES",
                    FilterExpression: "contains(name, :name)",
                    ExclusiveStartKey: {
                        id: { N: key },
                    },
                    ExpressionAttributeValues: {
                        ":name": { S: `${noCommands}` },
                    },
                    Limit: 100,
                }));
                if (!results.LastEvaluatedKey)
                    break;
                if (!results.LastEvaluatedKey["id"].N)
                    break;
                key = results.LastEvaluatedKey["id"].N;
                if (!results.Items)
                    break;
                allResults = [...allResults, ...results.Items];
            } while (((_a = results.Items) === null || _a === void 0 ? void 0 : _a.length) || results.LastEvaluatedKey);
            if (allResults.length > 0) {
                const card = allResults[0];
                const cardId = card["id"].S || "";
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
                const cardLinkMarkers = card["linkMarkers"].SS || [""];
                const cardSets = card["cardSets"].SS || [""];
                const cardImages = card["cardImages"].SS || [""];
                let type = "";
                const tuner = cardType.indexOf("Tuner") > -1 ? true : false;
                if (cardType.indexOf("Monster") > -1) {
                    if (cardType.indexOf("Normal") > -1)
                        type = "NORMAL_MONSTER";
                    else
                        type = "EFFECT_MONSTER";
                    if (type.indexOf("Synchro") > -1)
                        type = "SYNCHRO_MONSTER";
                    if (type.indexOf("Xyz") > -1)
                        type = "XYZ_MONSTER";
                    if (type.indexOf("Pendulum") > -1)
                        type = "PENDULUM_MONSTER";
                    if (type.indexOf("Link") > -1)
                        type = "LINK_MONSTER";
                }
                let text = "";
                text.concat("*" + cardName + "*");
                text.concat("\n");
                if (cardType.length > 0) {
                    text.concat(cardType);
                    if (cardAttribute.length > 0)
                        text.concat("\n");
                }
                if (cardRace.length > 0) {
                    text.concat(cardRace);
                }
                if (cardAttribute.length > 0) {
                    text.concat(" " + cardAttribute);
                    text.concat("\n");
                }
                if (cardLevel.length > 0) {
                    if (tuner)
                        text.concat("Tuner ");
                    text.concat(cardLevel);
                    text.concat("\n");
                }
                switch (type) {
                    case "NORMAL_MONSTER":
                    case "EFFECT_MONSTER":
                    case "SYNCHRO_MONSTER":
                    case "XYZ_MONSTER":
                    case "PENDULUM_MONSTER":
                        text.concat("Attack *" + cardAttack + "* / Defense *" + cardDefense + "*");
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
        const sendMessage = {
            chat_id: chatId,
            text: text,
            reply_to_message_id: replyId,
        };
        const req = https_1.default.request(httpsOption);
        req.on("error", (error) => {
            console.log(error);
        });
        req.write(JSON.stringify(sendMessage));
        req.end();
        return {
            statusCode: 200,
            body: JSON.stringify(sendMessage),
        };
    });
};
