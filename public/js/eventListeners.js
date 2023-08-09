window.addEventListener('click', (event) => {
    const currentPlayer = frontEndPlayers[socket.id];
    const angle = Math.atan2(
        (event.clientY * window.devicePixelRatio) - currentPlayer.y,
        (event.clientX * window.devicePixelRatio) - currentPlayer.x
    )
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }

    socket.emit('shoot', {
        x: currentPlayer.x,
        y: currentPlayer.y,
        angle
    })
})
