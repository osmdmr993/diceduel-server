const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const BOT_NAMES = [
  'CryptoWhale_88',
  'SolanaKing',
  'DegenTrader',
  'AlphaSeeker',
  'SatoshiGhost',
  'LuckyStrike',
  'MoonBuster',
  'NeonRider',
];

const BET_OPTIONS = [1, 2.5, 5, 10, 20];

let rooms = [
  { id: 'room-1', creator: 'CryptoWhale_88', betAmount: 10, isBot: true },
  { id: 'room-2', creator: 'SolanaKing', betAmount: 2.5, isBot: true },
  { id: 'room-3', creator: 'DegenTrader', betAmount: 20, isBot: true },
];

// Dinamik Lobi Akışı: Her 8 saniyede bir odayı yenile / bot odası aç
setInterval(() => {
  if (rooms.length >= 6) {
    rooms.pop(); // En eski odayı çıkar
  }
  const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const randomBet = BET_OPTIONS[Math.floor(Math.random() * BET_OPTIONS.length)];

  rooms.unshift({
    id: `room-${Date.now()}`,
    creator: randomBot,
    betAmount: randomBet,
    isBot: true,
  });

  io.emit('rooms_update', rooms);
}, 8000);

io.on('connection', (socket) => {
  socket.emit('rooms_update', rooms);

  socket.on('create_room', ({ creator, betAmount }) => {
    const newRoom = {
      id: `room-${Date.now()}`,
      creator: creator || 'Anonim',
      betAmount: Number(betAmount),
      isBot: false,
      socketId: socket.id,
    };

    rooms.unshift(newRoom);
    io.emit('rooms_update', rooms);

    // Bot 3.5 saniye içinde maçı kabul eder
    setTimeout(() => {
      const rIndex = rooms.findIndex((r) => r.id === newRoom.id);
      if (rIndex !== -1) {
        const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const p1Score = Math.floor(Math.random() * 100) + 1;
        let p2Score = Math.floor(Math.random() * 100) + 1;
        while (p1Score === p2Score) p2Score = Math.floor(Math.random() * 100) + 1;

        rooms.splice(rIndex, 1);
        io.emit('rooms_update', rooms);

        io.to(newRoom.socketId).emit('game_started', {
          roomId: newRoom.id,
          opponent: botName,
          betAmount: newRoom.betAmount,
          p1Score,
          p2Score,
          winner: p1Score > p2Score ? 'Sen' : botName,
        });
      }
    }, 3500);
  });

  socket.on('disconnect', () => {
    rooms = rooms.filter((r) => r.socketId !== socket.id);
    io.emit('rooms_update', rooms);
  });
});

app.get('/', (req, res) => res.send('DiceDuel Canlı Lobi Aktif 🎲'));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));
