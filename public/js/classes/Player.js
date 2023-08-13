class Player {

    static SPEED = 8;
    static MAX_RADIUS = 15;

    constructor({x, y, radius, color, name, avatarUrl, score = 0}) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.score = score
        this.name = name
        this.avatarUrl = avatarUrl
    }

    draw() {
        mainCtx.font = '12px sans-serif'
        mainCtx.fillStyle = 'white'

        mainCtx.fillText(this.name,
            this.x - (this.name.length - 2) * 4,
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