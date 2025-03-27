'use strict';

let usernamePage = document.querySelector('#username-page');
let chatPage = document.querySelector('#chat-page');
let messageForm = document.querySelector('#messageForm');
let usernameForm = document.querySelector('#usernameForm');
let messageInput = document.querySelector('#message');
let messageArea = document.querySelector('#messageArea');
let connectingElement = document.querySelector('.connecting');

let stompClient = null;
let username = null;

let colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {

        let headerAvatar = document.querySelector("#headerAvatar");

        if (headerAvatar) {
            headerAvatar.style.backgroundColor = getAvatarColor(username);
            headerAvatar.textContent = username[0].toUpperCase();
        }

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        let socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}



function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    let messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        let chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    let message = JSON.parse(payload.body);

    username = document.querySelector('#name').value.trim();
    let messageElement = document.createElement('li');

    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        if(message.sender === username){
            messageElement.textContent = 'You' + (message.type === 'JOIN' ? ' joined!' : ' left!');
        }
        else {messageElement.textContent = message.sender + (message.type === 'JOIN' ? ' joined!' : ' left!');}

    } else {
        if (message.sender === username) {
            // Tin nhắn của chính mình
            messageElement.classList.add("my-message");

            let messageContainer = document.createElement("div");
            messageContainer.classList.add("my-message-container");
            messageContainer.style.backgroundColor = getAvatarColor(message.sender);
            messageContainer.style.color = 'white'

            let textElement = document.createElement("p");
            textElement.textContent = message.content;

            messageContainer.appendChild(textElement);
            messageElement.appendChild(messageContainer);
        } else {
            // Tin nhắn của người khác
            messageElement.classList.add("other-message");

            let messageContainer = document.createElement("div");
            messageContainer.classList.add("other-message-container");


            // Tạo avatar
            let avatarElement = document.createElement('i');
            avatarElement.textContent = message.sender[0];
            avatarElement.classList.add("avatar-icon");
            avatarElement.style.backgroundColor = getAvatarColor(message.sender);

            // Tạo tên người gửi
            let usernameElement = document.createElement("span");
            usernameElement.textContent = message.sender;

            let textElement = document.createElement("p");
            textElement.textContent = message.content;

            // Gắn avatar + tên vào container
            messageContainer.appendChild(avatarElement);
            messageContainer.appendChild(usernameElement);
            messageContainer.appendChild(textElement);

            // Gắn container vào messageElement
            messageElement.appendChild(messageContainer);
        }
    }

// Thêm tin nhắn vào messageArea
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

}




function getAvatarColor(messageSender) {
    let hash = 0;
    for (let i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    let index = Math.abs(hash % colors.length);
    return colors[index];
}

document.querySelector("#exitButton").addEventListener("click", leaveChat);
function leaveChat() {
    if (stompClient) {
        let chatMessage = {
            sender: username,
            type: "LEAVE"
        };

        stompClient.send("/app/chat.addUser", {}, JSON.stringify(chatMessage));

        stompClient.disconnect();
        chatPage.classList.add("hidden");
        usernamePage.classList.remove("hidden");
    }
}

usernameForm.addEventListener('submit', connect,true);



messageForm.addEventListener('submit', sendMessage, true)