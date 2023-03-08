import {
  DynamoDBClient,
  BatchWriteItemCommand,
  DynamoDB,
  PutItemCommand,
  WriteRequest,
  PutRequest,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import {
  Card,
  CardInput,
  CardSet,
  CardSetInput,
  CardImage,
  CardImageInput,
} from "./card";

// Handler
exports.handler = async function (event: any, context: any) {
  const cards: Card[] = [];
  const batchRequests: WriteRequest[] = [];

  const tableName: string = process.env.TABLE_NAME || "ygoTcg";
  console.log(tableName);
  event.Records.forEach((record: { body: string }) => {
    const cardInput = JSON.parse(record.body) as CardInput;
    const card = new Card(cardInput);
    cards.push(card);

    batchRequests.push({
      PutRequest: {
        Item: {
          id: { S: card.id.toString() },
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
            SS: card.linkMarkers || [""],
          },
          cardSets: { SS: card.cardSets.map((set) => set.setName) },
          cardImages: { SS: card.cardImages.map((img) => img.imageUrl) },
        },
      },
    });
  });

  const db = new DynamoDBClient({ region: "us-east-2" });
  const results = await db.send(
    new BatchWriteItemCommand({
      RequestItems: {
        "ygoTcg": batchRequests
      },
    })
  );

  if(results)
    console.log("RESULTS", JSON.stringify(results));
};
