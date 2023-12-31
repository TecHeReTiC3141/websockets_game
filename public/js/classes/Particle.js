const friction = 0.99
class Particle {
  constructor({ x, y, radius, color, velocity, alpha = 1 }) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.alpha = alpha
  }

  draw() {
    mainCtx.save()
    mainCtx.shadowColor = 'white';
    mainCtx.shadowBlur = 10;

    mainCtx.globalAlpha = this.alpha
    mainCtx.beginPath()
    mainCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    mainCtx.fillStyle = this.color
    mainCtx.fill()
    mainCtx.restore()
  }

  update() {
    this.draw()
    this.velocity.x *= friction
    this.velocity.y *= friction
    this.x = this.x + this.velocity.x
    this.y = this.y + this.velocity.y
    this.alpha = Math.max(this.alpha - 0.01, 0)
  }
}
