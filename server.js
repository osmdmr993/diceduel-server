const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8840072261:AAGPbmSnlpXjcFIzgUCOAGXDzKc38629jwM';
const WEBAPP_URL = 'https://diceduel.fun';

// Telegram Bot Karşılama ve Başlatma Motoru
try {
  const TelegramBot = require('node-telegram-bot-api');
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'Oyuncu';

    bot.sendMessage(
      chatId,
      `🎲 **DiceDuel Gaming Hub'a Hoş Geldin, ${firstName}!**\n\n` +
      `🔥 Provably Fair Zar Düelloları, Yazı-Tura ve Günlük USDT Çarkı seni bekliyor.\n\n` +
      `🎁 **Günlük Ücretsiz Çark:** Her 24 saatte bir ücretsiz USDT kazan!\n` +
      `👥 **Referans Geliri:** Arkadaşlarını davet et, her oyunlarından %0.5 anında kazan.\n\n` +
      `Aşağıdaki butona dokunarak hemen oyuna başlayabilirsin:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Oyunu Başlat / Play Now', web_app: { url: WEBAPP_URL } }]
          ]
        }
      }
    );
  });

  console.log('🤖 Telegram Bot başarıyla başlatıldı ve dinliyor...');
} catch (error) {
  console.error('Telegram bot başlatılırken hata oluştu:', error);
}

// Canlı Oyun Odaları (P2P Memory)
let rooms = [
  { id: 'room-1', creator: 'CryptoWhale_88', betAmount: 10 },
  { id: 'room-2', creator: 'DegenKing_07', betAmount: 25 },
  { id: 'room-3', creator: 'LuckyStrike', betAmount: 5 }
];

io.on('connection', (socket) => {
  socket.emit('rooms_update', rooms);

  socket.on('create_room', (data) => {
    const newRoom = {
      id: `room-${Date.now()}`,
      creator: data.creator || 'Anonim',
      betAmount: data.betAmount || 5
    };
    rooms.unshift(newRoom);
    if (rooms.length > 8) rooms.pop();
    io.emit('rooms_update', rooms);
  });
});

app.get('/', (req, res) => {
  res.send('🎲 DiceDuel Çoklu Oyun & Telegram Bot Sunucusu Canlı!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
