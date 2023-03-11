import {
  DynamoDBClient,
  BatchWriteItemCommand,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { Card, CardInput } from "./card";

// Handler
exports.handler = async function (event: any, context: any) {
  const cards: Card[] = [];
  const batchRequests: WriteRequest[] = [];

  if (!process.env.TABLE_NAME || !process.env.REGION) {
    return;
  }
  const tableName = process.env.TABLE_NAME;
  const region = process.env.REGION;

  event.Records.forEach((record: { body: string }) => {
    const cardInput = JSON.parse(record.body) as CardInput;
    const card = new Card(cardInput);
    cards.push(card);

    batchRequests.push({
      PutRequest: {
        Item: {
          id: { N: `${card.id}` },
          name: { S: card.name },
          type: { S: card.type },
          desc: { S: card.desc },
          race: { S: card.race },
          atk: { N: card.atk?.toString() || "0" },
          def: { N: card.def?.toString() || "0" },
          level: { N: card.level?.toString() || "0" },
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

  const db = new DynamoDBClient({ region: region });
  const batch: Record<string, WriteRequest[]> = {};
  batch[tableName] = batchRequests;
  await db.send(
    new BatchWriteItemCommand({
      RequestItems: batch,
    })
  );

  db.destroy();
};
