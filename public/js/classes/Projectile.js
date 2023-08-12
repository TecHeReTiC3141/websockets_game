class Projectile {

  speed = 5;
  constructor({ x, y, radius, color, velocity, playerId }) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.playerId = playerId
  }

  draw() {
    mainCtx.save()

    mainCtx.shadowColor = this.color
    mainCtx.shadowBlur = 15
    mainCtx.beginPath()
    mainCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    mainCtx.fillStyle = this.color
    mainCtx.fill()

    mainCtx.restore()
  }

  update() {
    this.draw()
    this.x = this.x + this.velocity.x * this.speed;
    this.y = this.y + this.velocity.y * this.speed;
  }
}
