window.addEventListener('click', (event) => {
    const currentPlayer = frontEndPlayers[socket.id];
    const displayCanvas = document.querySelector('#displayCanvas');
    const { top, left } = displayCanvas.getBoundingClientRect();

    const angle = Math.atan2(
        event.clientY + sy - top - currentPlayer.y,
        event.clientX + sx - left - currentPlayer.x
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

const usernameForm = document.querySelector('.username-form');
usernameForm.addEventListener('submit', ev => {
    ev.preventDefault();
    const username = usernameForm.querySelector('#name').value;
    socket.emit('startGame', {
        username,
        width: mainCanvas.width,
        height: mainCanvas.height,
        devicePixelRatio
    });
    document.querySelector('.username-container').style.display = 'none';
})