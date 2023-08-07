const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const socket = io();
socket.on('updatePlayers', (backendPlayers) => {
  for (let id in backendPlayers) {
    const { x, y, radius, color } = backendPlayers[id];
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({ x, y, radius, color });
    }
  }

  for (let id in frontEndPlayers) {
    if (!backendPlayers[id]) {
      delete frontEndPlayers[id];
    }
  }
})

canvas.width = innerWidth
canvas.height = innerHeight

window.addEventListener('resize', () => {
  canvas.width = innerWidth
  canvas.height = innerHeight
})

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  for (let playerId in frontEndPlayers) {
    let player = frontEndPlayers[playerId];
    player.draw()
  }
}

document.addEventListener('click', ev => {
  const currentPlayer = frontEndPlayers[socket.id];
  currentPlayer.x = ev.clientX;
  currentPlayer.y = ev.clientY;
})

animate()
// spawnEnemies()
