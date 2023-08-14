const chat = $('.chat');
const messageInput = $('#message-input')
$('.toggle-chat').on('click', function () {
    $('i', this).toggleClass('fa-caret-up')
        .toggleClass('fa-caret-down');

    $('.chat-content').toggleClass('open')
})

$(document).on('keydown', function (ev) {
    if (ev.code === 'Enter' && messageInput.is(':focus') && messageInput.val()) {
        socket.emit('newMessage',
            {message: messageInput.val(),});
        messageInput.val('');
    }
})