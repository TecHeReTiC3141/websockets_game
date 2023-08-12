class Player {

  static SPEED = 10;
  static MAX_RADIUS = 15;

  constructor({ x, y, radius, color, username, avatarUrl, score = 0 }) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.score = score
    this.username = username
    this.avatarUrl = avatarUrl
  }

  draw() {
    mainCtx.font = '12px sans-serif'
    mainCtx.fillStyle = 'white'

    mainCtx.fillText(this.username,
        this.x - (this.username.length - 2) * 4,
        this.y + this.radius + 15)
    mainCtx.save()
    mainCtx.shadowColor = this.color;
    mainCtx.shadowBlur = 25;
    mainCtx.beginPath()
    mainCtx.arc(this.x, this.y, this.radius,
      0, Math.PI * 2, false)
    mainCtx.fillStyle = this.color
    mainCtx.fill()

    mainCtx.restore()
  }
}