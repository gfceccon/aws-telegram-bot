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
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const card_1 = require("./card");
// Handler
exports.handler = function (event, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const cards = [];
        const batchRequests = [];
        if (!process.env.TABLE_NAME || !process.env.VARIABLES_TABLE_NAME) {
            return;
        }
        const tableName = process.env.TABLE_NAME;
        const variablesTableName = process.env.VARIABLES_TABLE_NAME;
        event.Records.forEach((record) => {
            var _a, _b, _c;
            const cardInput = JSON.parse(record.body);
            const card = new card_1.Card(cardInput);
            cards.push(card);
            batchRequests.push({
                PutRequest: {
                    Item: {
                        id: { N: `${card.id}` },
                        name: { S: card.name },
                        type: { S: card.type },
                        desc: { S: card.desc },
                        race: { S: card.race },
                        atk: { N: ((_a = card.atk) === null || _a === void 0 ? void 0 : _a.toString()) || "0" },
                        def: { N: ((_b = card.def) === null || _b === void 0 ? void 0 : _b.toString()) || "0" },
                        level: { N: ((_c = card.level) === null || _c === void 0 ? void 0 : _c.toString()) || "0" },
                        attribute: { S: card.attribute || "" },
                        archetype: { S: card.archetype || "" },
                        scale: { S: card.scale || "" },
                        link: { S: card.link || "" },
                        linkMarkers: {
                            SS: [...new Set(card.linkMarkers), ""],
                        },
                        cardSets: {
                            SS: [...new Set(card.cardSets.map((set) => set.setCode)), ""],
                        },
                        cardImages: {
                            SS: [...card.cardImages.map((img) => img.imageUrl), ""],
                        },
                    },
                },
            });
        });
        const db = new client_dynamodb_1.DynamoDBClient({ region: "us-east-2" });
        const batch = {};
        batch[tableName] = batchRequests;
        yield db.send(new client_dynamodb_1.BatchWriteItemCommand({
            RequestItems: batch,
        }));
        db.destroy();
    });
};
