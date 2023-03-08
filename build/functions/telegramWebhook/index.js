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
// Handler
exports.handler = function (event, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = "/sendMessage";
        const host = `api.telegram.org/bot${process.env.BOT_TOKEN}`;
        const httpsOption = {
            hostname: host,
            port: 443,
            path: path,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        };
        const chatId = event.body.message.chat.chat_id;
        const text = "test";
        const replyId = event.body.message.message_id;
        const message = {
            "chat_id": chatId,
            "text": text,
            "reply_to_message_id": replyId
        };
        const req = https_1.default.request(httpsOption);
        req.on("error", (error) => {
            console.log(error);
        });
        req.write(JSON.stringify(message));
        req.end();
        return {
            statusCode: 200,
            body: JSON.stringify(message),
        };
    });
};
