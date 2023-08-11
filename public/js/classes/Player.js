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
    c.font = '12px sans-serif'
    c.fillStyle = 'white'

    c.fillText(this.username,
        this.x - (this.username.length - 2) * 4,
        this.y + this.radius + 15)
    c.save()
    c.shadowColor = this.color;
    c.shadowBlur = 25;
    c.beginPath()
    c.arc(this.x, this.y, this.radius,
      0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()

    c.restore()
  }
}