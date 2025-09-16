// Variables
const EZ_MULTIPLIER = 1.75

// Get Beatmaps
let allBeatmaps
async function getBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data.beatmaps
}
getBeatmaps()
// Find Beatmaps
const findBeatmaps = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))

// Team Name Variables
const teamNameLeftEl = document.getElementById("team-name-left")
const teamNameRightEl = document.getElementById("team-name-right")
let currentTeamNameLeft, currentTeamNameRight

// Score Visibility
const scoreEl = document.getElementById("score")
const chatDisplayEl = document.getElementById("chat-display")
let scoreVisibility

// Current score
const currentScoreLeftEl = document.getElementById("current-score-left")
const currentScoreRightEl = document.getElementById("current-score-right")
const currentScoreDifferenceEl = document.getElementById("current-score-difference")
// Animations
const animation = {
    "currentScoreLeft": new CountUp(currentScoreLeftEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "."}),
    "currentScoreRight": new CountUp(currentScoreRightEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "."}),
    "currentScoreDifference": new CountUp(currentScoreDifferenceEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "."}), 
}

// Scorebar
const scorebarStarEl = document.getElementById("scorebar-star")

// Chat display container
const messagesContainerEl = document.getElementById("messages-container")
let chatLen = 0

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

    // Team Names
    if (currentTeamNameLeft !== data.tourney.team.left) {
        currentTeamNameLeft = data.tourney.team.left
        teamNameLeftEl.textContent = currentTeamNameLeft
    }
    if (currentTeamNameRight !== data.tourney.team.right) {
        currentTeamNameRight = data.tourney.team.right
        teamNameRightEl.textContent = currentTeamNameRight
    }

    // Score visibility
    if (scoreVisibility !== data.tourney.scoreVisible) {
        scoreVisibility = data.tourney.scoreVisible
        if (scoreVisibility) {
            scoreEl.style.opacity = 1
            chatDisplayEl.style.opacity = 0
        } else {
            scoreEl.style.opacity = 0
            chatDisplayEl.style.opacity = 1
        }
    }

    // Display Score
    if (scoreVisibility) {
        let currentLeftScore = 0, currentRightScore = 0, currentScoreDifference = 0

        for (let i = 0; i < data.tourney.clients.length; i++) {
            let currentPlay = data.tourney.clients[i].play
            let currentMods = getMods(currentPlay.mods.number)
            currentPlay.score *= currentMods.includes("EZ") ? 1.75 : 1
            data.tourney.clients[i].team === "left" ? currentLeftScore += currentPlay.score : currentRightScore += currentPlay.score
        }

        currentScoreDifference = Math.abs(currentRightScore - currentLeftScore)
        // Animate
        animation.currentScoreLeft.update(currentLeftScore)
        animation.currentScoreRight.update(currentRightScore)
        animation.currentScoreDifference.update(currentScoreDifference)

        // Set position of star
        const scoreDifferencePercent = Math.min(currentScoreDifference / 1000000, 1)
        const scoreDifferencePosition = Math.min(Math.pow(scoreDifferencePercent, 0.5) * 150, 150)

        // Scorebar
        if (currentLeftScore > currentRightScore) {
            scorebarStarEl.style.left = `${960 - scoreDifferencePosition}px`
            scorebarStarEl.setAttribute("src", `static/score-stars/left-star-full.png`)
        } else if (currentRightScore > currentLeftScore) {
            scorebarStarEl.style.left = `${960 + scoreDifferencePosition}px`
            scorebarStarEl.setAttribute("src", `static/score-stars/right-star-full.png`)
        } else if (currentRightScore === currentLeftScore) {
            scorebarStarEl.style.left = `960px`
            scorebarStarEl.setAttribute("src", `static/score-stars/middle-star-full.png`)
        }
    }

    // Chat display
    if (!scoreVisibility) {
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
}

// Update star count
let currentLeftStars, currentRightStars, currentFirstTo, toggleStars
setInterval(() => {
    // Toggle stars
    toggleStars = getCookie("toggleStars")
    if (toggleStars === "true") {
        leftTeamStarContainerEl.style.display = "flex"
        rightTeamStarContainerEl.style.display = "flex"

        // Update stars
        currentLeftStars = Number(getCookie("currentLeftStars"))
        currentRightStars = Number(getCookie("currentRightStars"))
        currentFirstTo = Number(getCookie("currentFirstTo"))
        createStarDisplay()
    } else {
        leftTeamStarContainerEl.style.display = "none"
        rightTeamStarContainerEl.style.display = "none"
    }
}, 200)

const leftTeamStarContainerEl = document.getElementById("star-container-left")
const rightTeamStarContainerEl = document.getElementById("star-container-right")
function createStarDisplay() {
    leftTeamStarContainerEl.innerHTML = ""
    rightTeamStarContainerEl.innerHTML = ""

    let i = 0
    for (i; i < currentLeftStars; i++) createStar("left", "fill")
    for (i; i < currentFirstTo; i++) createStar("left", "empty")
    i = 0
    for (i; i < currentRightStars; i++) createStar("right", "fill")
    for (i; i < currentFirstTo; i++) createStar("right", "empty")

    function createStar(colour, status) {
        const wrapper = document.createElement("div")
        wrapper.classList.add("team-star-wrapper")

        const image = document.createElement("img")
        image.setAttribute("src", `static/stars/${colour}-star-${status === "fill" ? "fill" : "empty"}.png`)

        wrapper.append(image)
        if (colour === "left") leftTeamStarContainerEl.append(wrapper)
        else rightTeamStarContainerEl.append(wrapper)
    }
}