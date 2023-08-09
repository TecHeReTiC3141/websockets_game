const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000, } );

const port = 3000
const PLAYER_SPEED = 8;

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {};

io.on('connection', socket => {
  console.log('a user connected');
  backEndPlayers[socket.id] = {
    x: 100 + Math.round(Math.random() * 500),
    y: 100 + Math.round(Math.random() * 500),
    radius: 3 + Math.round(Math.random() * 12),
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    sequenceNumber: 0,
  }

  io.emit('updatePlayers', backEndPlayers);

  socket.on('keydown', ({ direction, sequenceNumber }) => {
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber;
    switch (direction) {
      case "left":
        backEndPlayers[socket.id].x -= PLAYER_SPEED
        break
      case "right":
        backEndPlayers[socket.id].x += PLAYER_SPEED
        break
      case "up":
        backEndPlayers[socket.id].y -= PLAYER_SPEED
        break
      case "down":
        backEndPlayers[socket.id].y += PLAYER_SPEED
        break
    }
  })

  socket.on('disconnect', reason => {
    console.log(reason, socket.id);
    delete backEndPlayers[socket.id];
    io.emit('updatePlayers', backEndPlayers);
  })
  console.log(backEndPlayers);
})

setInterval(() => {
  io.emit('updatePlayers', backEndPlayers);
}, 15);

server.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})
