import axios from "axios";
import { CardInput } from "./functions/updateDatabase/card";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";

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
  SECREAT_KEY: string,
  REGION: string,
  QUEUE_URL: string
) => {
  const sqs = new SQSClient({
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECREAT_KEY,
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

(async () => {
  if (
    !process.env.CARDINFO_URL ||
    !process.env.ACCESS_KEY ||
    !process.env.SECREAT_KEY ||
    !process.env.REGION ||
    !process.env.QUEUE_URL
  )
    return;
  console.log("GETTING CARDS FROM", process.env.CARDINFO_URL);
  const cards = await getCards(process.env.CARDINFO_URL);
  console.log("TOTAL NUMBER OF CARDS", cards.length);

  console.log("SENDING CARDS TO SQS");
  const sqsOuput = await sendSQS(
    cards,
    process.env.ACCESS_KEY,
    process.env.SECREAT_KEY,
    process.env.REGION,
    process.env.QUEUE_URL
  );

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
})();
