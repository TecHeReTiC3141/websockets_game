const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const socket = io();
socket.on('updatePlayers', (backendPlayers) => {
  for (let id in backendPlayers) {
    const { x, y, radius, color } = backendPlayers[id];
    if (!players[id]) {
      players[id] = new Player(x, y, radius, color);
    }

  }

  for (let id in players) {
    if (!backendPlayers[id]) {
      delete players[id];
    }
  }
  console.log(players);
})

canvas.width = innerWidth
canvas.height = innerHeight

window.addEventListener('resize', () => {
  canvas.width = innerWidth
  canvas.height = innerHeight
})

const x = canvas.width / 2
const y = canvas.height / 2

const players = {}

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4

    let x
    let y

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
      y = Math.random() * canvas.height
    } else {
      x = Math.random() * canvas.width
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)

    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    }

    enemies.push(new Enemy(x, y, radius, color, velocity))
  }, 1000)
}

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  for (let playerId in players) {
    let player = players[playerId];
    player.draw()
  }
}

animate()
// spawnEnemies()
