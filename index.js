const TelegramBot = require("node-telegram-bot-api");
const { HfInference } = require("@huggingface/inference");

const huggingFaceApiKey = "YOUR_HUGGING_FACE_API_TOKEN";
const telegramToken = "YOUR_TELEGRAM_BOT_TOKEN";

const bot = new TelegramBot(telegramToken, { polling: true });
const inference = new HfInference(huggingFaceApiKey);

const chats = {};

async function callHuggingFaceApi(messages) {
  let out = "";

  for await (const chunk of inference.chatCompletionStream({
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    messages,
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 0.7,
  })) {
    if (chunk.choices && chunk.choices.length > 0) {
      const newContent = chunk.choices[0].delta.content;
      out += newContent;
    }
  }

  return out;
}

function getConversationHistory(chatId) {
  if (!chats[chatId]) {
    chats[chatId] = [];
  }

  return chats[chatId];
}

// Listen for messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  const conversationHistory = getConversationHistory(chatId);
  conversationHistory.push({ role: "user", content: userMessage });

  const { message_id } = await bot.sendMessage(chatId, "Thinking...");

  const aiResponse = await callHuggingFaceApi(conversationHistory);

  conversationHistory.push({ role: "assistant", content: aiResponse });

  bot.editMessageText(aiResponse, { chat_id: chatId, message_id });
});
