import axios from "axios";
import { CardInput } from "./functions/updateDatabase/card";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DynamoDBClient,
  KeysAndAttributes,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";

interface CardInfoResponse {
  data: CardInput[];
}

const getCards = async (url: string): Promise<CardInput[]> => {
  return axios.get(url).then((response) => {
    const cards = response.data as CardInfoResponse;
    return cards.data;
  });
};

const sendSQS = async (
  cards: CardInput[],
  ACCESS_KEY: string,
  SECRET_KEY: string,
  REGION: string,
  QUEUE_URL: string
) => {
  const sqs = new SQSClient({
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
    region: REGION,
  });
  const chunkSize = 10;
  const chunks = Array.from(
    { length: Math.ceil(cards.length / chunkSize) },
    (_, i) => cards.slice(i * chunkSize, i * chunkSize + chunkSize)
  );

  const queueCommands: Promise<{ successful: number; failed: number }>[] = [];

  chunks.forEach((chunk) => {
    const entries = chunk.map((card) => {
      return { Id: card.id, MessageBody: JSON.stringify(card) };
    });
    queueCommands.push(
      sqs
        .send(
          new SendMessageBatchCommand({
            Entries: entries,
            QueueUrl: QUEUE_URL,
          })
        )
        .then((output) => {
          return {
            successful: output.Successful?.length || 0,
            failed: output.Failed?.length || 0,
          };
        })
        .catch((error) => {
          console.log(error);
          return { successful: 0, failed: 0 };
        })
    );
  });
  return Promise.all(queueCommands);
};

const sendDb = async (
  cards: CardInput[],
  VARIABLES_TABLE_NAME: string,
  ACCESS_KEY: string,
  SECREAT_KEY: string,
  REGION: string
) => {
  const db = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECREAT_KEY,
    },
  });

  const readBatch: Record<string, KeysAndAttributes> = {};
  readBatch[VARIABLES_TABLE_NAME] = {
    Keys: [{ id: { S: "MIN_CARD_ID" } }, { id: { S: "MAX_CARD_ID" } }],
  };

  const variables = await db.send(
    new BatchGetItemCommand({
      RequestItems: readBatch,
    })
  );
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

  const writeBatch: Record<string, WriteRequest[]> = {};
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

  const results = await db.send(
    new BatchWriteItemCommand({
      RequestItems: writeBatch,
    })
  );
  console.log(results);
  return results;
};

(async () => {
  if (
    !process.env.CARDINFO_URL ||
    !process.env.ACCESS_KEY ||
    !process.env.SECRET_KEY ||
    !process.env.REGION ||
    !process.env.QUEUE_URL ||
    !process.env.VARIABLES_TABLE_NAME
  )
    return;
  console.log("GETTING CARDS FROM", process.env.CARDINFO_URL);
  const cards = await getCards(process.env.CARDINFO_URL);
  console.log("TOTAL NUMBER OF CARDS", cards.length);

  console.log("SENDING CARDS TO SQS");
  const sqsOuput = await sendSQS(
    cards,
    process.env.ACCESS_KEY,
    process.env.SECRET_KEY,
    process.env.REGION,
    process.env.QUEUE_URL
  );

  if (sqsOuput) {
    const output = sqsOuput.reduce(
      (previous, current) => {
        return {
          successful: current.successful + previous.successful,
          failed: current.failed + previous.failed,
        };
      },
      { successful: 0, failed: 0 }
    );
    console.log("SQS OUTPUT", output);
  }

  console.log("SENDING VARIABLES TO DYNAMODB");
  const dbOutput = await sendDb(
    cards,
    process.env.VARIABLES_TABLE_NAME,
    process.env.ACCESS_KEY,
    process.env.SECRET_KEY,
    process.env.REGION
  );

  if (dbOutput) {
    const consumed = dbOutput.ConsumedCapacity?.map((capacity) => {
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
            .map((request: WriteRequest) => {
              return {
                put: request.PutRequest ? 1 : 0,
                delete: request.DeleteRequest ? 1 : 0,
              };
            })
            .reduce(
              (previous, current) => {
                return {
                  put: current.put + previous.put,
                  delete: current.delete + previous.delete,
                };
              },
              { put: 0, delete: 0 }
            );
          console.log(unprocessed);
        }
      });
    }
  }
})();
