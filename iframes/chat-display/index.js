// Chat display container
const messagesContainerEl = document.getElementById("messages-container")
let chatLen = 0

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        (chatLen === 0 || chatLen > data.tourney.chat.length) ? (messagesContainerEl.innerHTML = "", chatLen = 0) : null
        const fragment = document.createDocumentFragment()
        for (let i = chatLen; i < data.tourney.chat.length; i++) {
            // Chat message container
            const chatMessageContainer = document.createElement("div")
            chatMessageContainer.classList.add("message-container")  
            // Name
            const chatMessageName = document.createElement("div")
            chatMessageName.classList.add("message-name", data.tourney.chat[i].team)
            chatMessageName.textContent = `${data.tourney.chat[i].name}:`
            // Message
            const chatMessageContent = document.createElement("div")
            chatMessageContent.classList.add("message-content")
            chatMessageContent.innerText = data.tourney.chat[i].message
            chatMessageContainer.append(chatMessageName, chatMessageContent)
            fragment.append(chatMessageContainer)
        }
        messagesContainerEl.append(fragment)
        chatLen = data.tourney.chat.length
        messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight
    }
}