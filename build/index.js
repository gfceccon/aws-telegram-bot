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
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.CARDINFO_URL ||
        !process.env.ACCESS_KEY ||
        !process.env.SECREAT_KEY ||
        !process.env.REGION ||
        !process.env.QUEUE_URL)
        return;
    console.log("GETTING CARDS FROM", process.env.CARDINFO_URL);
    const cards = yield getCards(process.env.CARDINFO_URL);
    console.log("TOTAL NUMBER OF CARDS", cards.length);
    console.log("SENDING CARDS TO SQS");
    const sqsOuput = yield sendSQS(cards, process.env.ACCESS_KEY, process.env.SECREAT_KEY, process.env.REGION, process.env.QUEUE_URL);
    const output = sqsOuput.reduce((previous, current) => {
        return {
            successful: current.successful + previous.successful,
            failed: current.failed + previous.failed,
        };
    }, { successful: 0, failed: 0 });
    console.log("SQS OUTPUT", output);
}))();
