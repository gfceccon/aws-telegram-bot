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
        const tableName = process.env.TABLE_NAME != undefined
            ? process.env.TABLE_NAME
            : "ygoTcg";
        event.Records.forEach((record) => {
            const card = new card_1.Card(record.body);
            cards.push(card);
            batchRequests.push({
                PutRequest: {
                    Item: {
                        id: { S: card.id },
                        name: { S: card.name },
                        type: { S: card.type },
                        frameType: { S: card.frameType },
                        desc: { S: card.desc },
                        race: { S: card.race },
                        atk: { N: card.atk + "" },
                        def: { N: card.def + "" },
                        level: { N: card.level + "" },
                        attribute: { S: card.attribute + "" },
                        archetype: { S: card.archetype + "" },
                        scale: { S: card.scale + "" },
                        link: { S: card.link + "" },
                        linkMarkers: {
                            SS: card.linkMarkers != null ? card.linkMarkers : [],
                        },
                        cardSets: { SS: card.cardSets.map((set) => set.setName) },
                        cardImages: { SS: card.cardImages.map((img) => img.imageUrl) },
                    },
                },
            });
        });
        const db = new client_dynamodb_1.DynamoDBClient({ region: "us-east-2" });
        const results = db.send(new client_dynamodb_1.BatchWriteItemCommand({
            RequestItems: {
                tableName: batchRequests,
            },
        }));
        return {
            statusCode: 200,
            body: JSON.stringify(cards.map((card) => {
                id: card.id;
                name: card.name;
                type: card.type;
                frameType: card.frameType;
                desc: card.desc;
                race: card.race;
                atk: card.atk;
                def: card.def;
                level: card.level;
                attribute: card.attribute;
                archetype: card.archetype;
                scale: card.scale;
                link: card.link;
                linkMarkers: card.linkMarkers;
                cardSets: card.cardSets;
                cardImages: card.cardImages;
            })),
        };
    });
};
