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
const axios_1 = __importDefault(require("axios"));
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const getCards = (url) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.get(url).then((response) => {
        const cards = response.data;
        return cards.data;
    });
});
const sendSQS = (cards, ACCESS_KEY, SECREAT_KEY, REGION, QUEUE_URL) => __awaiter(void 0, void 0, void 0, function* () {
    const sqs = new client_sqs_1.SQSClient({
        credentials: {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECREAT_KEY,
        },
        region: REGION,
    });
    const chunkSize = 10;
    const chunks = Array.from({ length: Math.ceil(cards.length / chunkSize) }, (_, i) => cards.slice(i * chunkSize, i * chunkSize + chunkSize));
    const queueCommands = [];
    chunks.forEach((chunk) => {
        const entries = chunk.map((card) => {
            return { Id: card.id, MessageBody: JSON.stringify(card) };
        });
        queueCommands.push(sqs
            .send(new client_sqs_1.SendMessageBatchCommand({
            Entries: entries,
            QueueUrl: QUEUE_URL,
        }))
            .then((output) => {
            var _a, _b;
            return {
                successful: ((_a = output.Successful) === null || _a === void 0 ? void 0 : _a.length) || 0,
                failed: ((_b = output.Failed) === null || _b === void 0 ? void 0 : _b.length) || 0,
            };
        })
            .catch((error) => {
            console.log(error);
            return { successful: 0, failed: 0 };
        }));
    });
    return Promise.all(queueCommands);
});
const sendDb = (cards, VARIABLES_TABLE_NAME, ACCESS_KEY, SECREAT_KEY, REGION) => __awaiter(void 0, void 0, void 0, function* () {
    const db = new client_dynamodb_1.DynamoDBClient({
        region: REGION,
        credentials: {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECREAT_KEY,
        },
    });
    // const minCardIdDb = await db.send(
    //   new GetItemCommand({
    //     TableName: `${VARIABLES_TABLE_NAME}`,
    //     Key: {
    //       id: { S: "MIN_CARD_ID" },
    //     },
    //     AttributesToGet: ["value"],
    //   })
    // );
    //   const maxCardIdDb = await db.send(
    // new GetItemCommand({
    //   TableName: `${VARIABLES_TABLE_NAME}`,
    //   Key: {
    //     id: { S: "MAX_CARD_ID" },
    //   },
    //   AttributesToGet: ["value"],
    // })
    // );
    const readBatch = {};
    readBatch[VARIABLES_TABLE_NAME] = {
        Keys: [{ id: { S: "MIN_CARD_ID" } }, { id: { S: "MAX_CARD_ID" } }],
    };
    const variables = yield db.send(new client_dynamodb_1.BatchGetItemCommand({
        RequestItems: readBatch,
    }));
    let minCardIdDb = null;
    let maxCardIdDb = null;
    console.log("MIN AND MAX VARIABLES", variables);
    if (variables.Responses && variables.Responses[VARIABLES_TABLE_NAME] && variables.Responses[VARIABLES_TABLE_NAME].length >= 2) {
        minCardIdDb = variables.Responses[VARIABLES_TABLE_NAME][0]["value"] || null;
        maxCardIdDb = variables.Responses[VARIABLES_TABLE_NAME][1]["value"] || null;
    }
    const cardIds = cards
        .map((card) => parseInt(card.id))
        .sort((a, b) => {
        return a - b;
    });
    let minCardId = cardIds[0];
    let maxCardId = cardIds[cardIds.length - 1];
    console.log(cards.filter((card) => card.id == maxCardId.toString()));
    if (minCardIdDb && minCardIdDb.S) {
        if (parseInt(minCardIdDb.S) < minCardId)
            minCardId = parseInt(minCardIdDb.S);
    }
    if (maxCardIdDb && maxCardIdDb.S) {
        if (parseInt(maxCardIdDb.S) > maxCardId)
            maxCardId = parseInt(maxCardIdDb.S);
    }
    const writeBatch = {};
    writeBatch[VARIABLES_TABLE_NAME] = [
        {
            PutRequest: {
                Item: {
                    id: { S: "MIN_CARD_ID" },
                    value: { S: `${minCardId}` },
                },
            },
        },
        {
            PutRequest: {
                Item: {
                    id: { S: "MAX_CARD_ID" },
                    value: { S: `${maxCardId}` },
                },
            },
        },
    ];
    const results = yield db.send(new client_dynamodb_1.BatchWriteItemCommand({
        RequestItems: writeBatch,
    }));
    console.log(results);
    return results;
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!process.env.CARDINFO_URL ||
        !process.env.ACCESS_KEY ||
        !process.env.SECREAT_KEY ||
        !process.env.REGION ||
        !process.env.QUEUE_URL ||
        !process.env.VARIABLES_TABLE_NAME)
        return;
    console.log("GETTING CARDS FROM", process.env.CARDINFO_URL);
    const cards = yield getCards(process.env.CARDINFO_URL);
    console.log("TOTAL NUMBER OF CARDS", cards.length);
    // console.log("SENDING CARDS TO SQS");
    // const sqsOuput = await sendSQS(
    //   cards,
    //   process.env.ACCESS_KEY,
    //   process.env.SECREAT_KEY,
    //   process.env.REGION,
    //   process.env.QUEUE_URL
    // );
    // if (sqsOuput) {
    //   const output = sqsOuput.reduce(
    //     (previous, current) => {
    //       return {
    //         successful: current.successful + previous.successful,
    //         failed: current.failed + previous.failed,
    //       };
    //     },
    //     { successful: 0, failed: 0 }
    //   );
    //   console.log("SQS OUTPUT", output);
    // }
    console.log("SENDING VARIABLES TO DYNAMODB");
    const dbOutput = yield sendDb(cards, process.env.VARIABLES_TABLE_NAME, process.env.ACCESS_KEY, process.env.SECREAT_KEY, process.env.REGION);
    if (dbOutput) {
        const consumed = (_a = dbOutput.ConsumedCapacity) === null || _a === void 0 ? void 0 : _a.map((capacity) => {
            return {
                tableName: capacity.TableName,
                capacityUnits: capacity.CapacityUnits,
                readCapacityUnits: capacity.ReadCapacityUnits,
                writeCapacityUnits: capacity.WriteCapacityUnits,
            };
        });
        console.log(consumed);
        if (dbOutput.UnprocessedItems) {
            Object.keys(dbOutput.UnprocessedItems).forEach((item) => {
                if (dbOutput.UnprocessedItems) {
                    const unprocessed = dbOutput.UnprocessedItems[item]
                        .map((request) => {
                        return {
                            put: request.PutRequest ? 1 : 0,
                            delete: request.DeleteRequest ? 1 : 0,
                        };
                    })
                        .reduce((previous, current) => {
                        return {
                            put: current.put + previous.put,
                            delete: current.delete + previous.delete,
                        };
                    }, { put: 0, delete: 0 });
                    console.log(unprocessed);
                }
            });
        }
    }
}))();
