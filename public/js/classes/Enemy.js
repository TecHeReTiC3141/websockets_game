class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }

  draw() {
    mainCtx.beginPath()
    mainCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    mainCtx.fillStyle = this.color
    mainCtx.fill()
  }

  update() {
    this.draw()
    this.x = this.x + this.velocity.x
    this.y = this.y + this.velocity.y
  }
}
