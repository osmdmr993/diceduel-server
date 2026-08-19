const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const BOT_NAMES = [
  'CryptoWhale_88',
  'SolanaKing',
  'DegenTrader',
  'AlphaSeeker',
  'SatoshiGhost',
  'LuckyStrike',
];

let rooms = [
  { id: 'room-1', creator: 'CryptoWhale_88', betAmount: 10, isBot: true },
  { id: 'room-2', creator: 'SolanaKing', betAmount: 2.5, isBot: true },
  { id: 'room-3', creator: 'DegenTrader', betAmount: 20, isBot: true },
];

io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  // Bağlanan kullanıcıya mevcut açık odaları gönder
  socket.emit('rooms_update', rooms);

  // Kullanıcı yeni oda açtığında
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

    // Bot Tetikleyici: 3-5 saniye içinde bot odaya girer ve zarlar atılır
    setTimeout(() => {
      const roomIndex = rooms.findIndex((r) => r.id === newRoom.id);
      if (roomIndex !== -1) {
        const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const p1Score = Math.floor(Math.random() * 100) + 1;
        let p2Score = Math.floor(Math.random() * 100) + 1;
        while (p1Score === p2Score) p2Score = Math.floor(Math.random() * 100) + 1;

        // Odayı kapat ve maçı başlat
        rooms.splice(roomIndex, 1);
        io.emit('rooms_update', rooms);

        io.to(newRoom.socketId).emit('game_started', {
          roomId: newRoom.id,
          opponent: botName,
          betAmount: newRoom.betAmount,
          p1Score: p1Score,
          p2Score: p2Score,
          winner: p1Score > p2Score ? 'Sen' : botName,
        });
      }
    }, 4000);
  });

  socket.on('disconnect', () => {
    rooms = rooms.filter((r) => r.socketId !== socket.id);
    io.emit('rooms_update', rooms);
  });
});

app.get('/', (req, res) => {
  res.send('DiceDuel WebSocket Sunucusu Aktif 🎲');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
