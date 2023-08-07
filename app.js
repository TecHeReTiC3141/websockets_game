const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000, } );

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const players = {};

io.on('connection', socket => {
  console.log('a user connected');
  players[socket.id] = {
    x: 100 + Math.round(Math.random() * 500),
    y: 100 + Math.round(Math.random() * 500),
    radius: 3 + Math.round(Math.random() * 12),
    color: 'red',
  }

  io.emit('updatePlayers', players);

  socket.on('disconnect', reason => {
    console.log(reason, socket.id);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  })
  console.log(players);
})

server.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})
