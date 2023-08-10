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

const usernameForm = document.querySelector('.username-form');
usernameForm.addEventListener('submit', ev => {
    ev.preventDefault();
    const name = usernameForm.querySelector('#name').value;
    console.log(name);
    socket.emit('startGame', name);
    document.querySelector('.username-container').style.display = 'none';
})