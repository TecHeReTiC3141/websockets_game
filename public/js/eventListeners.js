window.addEventListener('click', (event) => {
    const currentPlayer = frontEndPlayers[socket.id];
    const canvas = document.querySelector('canvas');
    const { top, left } = canvas.getBoundingClientRect();

    const angle = Math.atan2(
        event.clientY - top - currentPlayer.y,
        event.clientX - left - currentPlayer.x
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
        width: canvas.width,
        height: canvas.height,
        devicePixelRatio
    });
    document.querySelector('.username-container').style.display = 'none';
})