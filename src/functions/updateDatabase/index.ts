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

  const tableName: string =
    process.env.TABLE_NAME != undefined
      ? (process.env.TABLE_NAME as string)
      : "ygoTcg";
  event.Records.forEach((record: { body: CardInput }) => {
    const card = new Card(record.body);
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

  const db = new DynamoDBClient({ region: "us-east-2" });
  const results = db.send(
    new BatchWriteItemCommand({
      RequestItems: {
        tableName: batchRequests,
      },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(cards.map((card) => {
      id: card.id
      name: card.name
      type: card.type
      frameType: card.frameType
      desc: card.desc
      race: card.race
      atk: card.atk
      def: card.def
      level: card.level
      attribute: card.attribute
      archetype: card.archetype
      scale: card.scale
      link: card.link
      linkMarkers: card.linkMarkers
      cardSets: card.cardSets
      cardImages: card.cardImages
    })),
  };
};
