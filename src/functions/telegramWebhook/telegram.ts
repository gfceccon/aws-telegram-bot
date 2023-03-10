namespace Telegram {
    export interface From {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name: string;
      username: string;
      language_code: string;
    }
    export interface Entity {
      offset: number;
      length: number;
      type: string;
    }
    export interface Chat {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
      type: string;
    }
    export interface Message {
      message_id: number;
      text: string | null;
      date: number;
      from: From | null;
      chat: Chat;
      entities: Entity[] | null;
    }
    export interface Update {
      update_id: number;
      message: Message | null;
    }
    export interface SendMessage {
      chat_id: number;
      text: string;
      reply_to_message_id: number;
    }
}

export { Telegram };
