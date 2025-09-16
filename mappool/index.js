let enableAutoAdvance = false

// Get Beatmaps
const roundNameEl = document.getElementById("round-name")
const sidebarMappoolContainerEl = document.getElementById("sidebar-mappool-container")
const preloadImagesEl = document.getElementById("preload-images")
let currentBestOf, currentFirstTo, currentLeftStars = 0, currentRightStars = 0
let allBeatmaps, currentMap
/**
 * Get all beatmaps from the beatmaps.json file
 * Set the round name
 * Set the best of and first to
 * Create panels
 * Call create star display function
 * Create sidebar mappool buttons
 */
async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps
    roundNameEl.innerText = responseJson.roundName

    switch (responseJson.roundName) {
        case "ROUND OF 32": case "ROUND OF 16":
            currentBestOf = 9; break;
        case "QUARTERFINALS": case "SEMIFINALS":
            currentBestOf = 11; break;
        case "FINALS": case "GRAND FINALS":
            currentBestOf = 13; break;
    }
    currentFirstTo = Math.ceil(currentBestOf / 2)

    for (let i = 0; i < currentFirstTo - 1; i++) {
        createTeamPickWrapper("left")
        createTeamPickWrapper("right")
    }

    function createTeamPickWrapper(side) {
        const teamPickWrapper = document.createElement("div")
        teamPickWrapper.classList.add("team-pick-wrapper")
        
        const teamPickBackgroundImage = document.createElement("div")
        teamPickBackgroundImage.classList.add("team-pick-background-image")

        const teamBottomSection = document.createElement("div")
        teamBottomSection.classList.add("team-pick-bottom-section")
        teamBottomSection.classList.add(`${side}-team-pick-bottom-section`)

        const teamPickModId = document.createElement("div")
        teamPickModId.classList.add("team-pick-mod-id")
        teamBottomSection.append(teamPickModId)

        teamPickWrapper.append(teamPickBackgroundImage, teamBottomSection)
        document.getElementById(`${side}-team-pick-container`).append(teamPickWrapper)
    }

    createStarDisplay()

    for (let i = 0; i < allBeatmaps.length; i++) {
        preloadImagesEl.setAttribute("srx", `https://assets.ppy.sh/beatmaps/${allBeatmaps[i].beatmapset_id}/covers/cover.jpg`)
        const button = document.createElement("button")
        button.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
        button.setAttribute("id", allBeatmaps[i].beatmap_id)
        button.dataset.id = allBeatmaps[i].beatmap_id
        button.dataset.pickTeam = "false"
        button.dataset.banTeam = "false"
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", event => event.preventDefault())
        sidebarMappoolContainerEl.append(button)
    }
}
getBeatmaps()

// Find Beatmaps
const findBeatmaps = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))

// Create Ban Wrapper
function createBanWrapper(currentMap, currentContainer, team) {
    team = team === "red" ? "left" : "right"

    const teamBanWrapper = document.createElement("div")
    teamBanWrapper.classList.add("team-ban-wrapper")
    teamBanWrapper.dataset.id = currentMap.beatmap_id
    teamBanWrapper.style.borderColor = `var(--${team}-colour)`

    const teamBanBackgroundImage = document.createElement("div")
    teamBanBackgroundImage.classList.add("team-ban-background-image")
    teamBanBackgroundImage.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`

    const teamBanModId = document.createElement("team-ban-mod-id")
    teamBanModId.classList.add("team-ban-mod-id")
    teamBanModId.innerText = `${currentMap.mod}${currentMap.order}`
    teamBanWrapper.style.color = `var(--${team}-colour)`

    teamBanWrapper.append(teamBanBackgroundImage, teamBanModId)
    currentContainer.append(teamBanWrapper)
}

// Team Ban Container
const leftTeamBanContainerEl = document.getElementById("left-team-ban-container")
const rightTeamBanContainerEl = document.getElementById("right-team-ban-container")
// Team Pick Container
const leftTeamPickContainerEl = document.getElementById("left-team-pick-container")
const rightTeamPickContainerEl = document.getElementById("right-team-pick-container")
let currentPickTile, currentPickMap
// Map Click Event
async function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    const currentMap = findBeatmaps(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"

    if (this.dataset.pickTeam === "true" || this.dataset.banTeam === "true") return

    if (action === "ban") {
        const currentContainer = team === "red" ? leftTeamBanContainerEl : rightTeamBanContainerEl
        
        // Check container size
        if (currentContainer.childElementCount < 2) {
            createBanWrapper(currentMap, currentContainer, team)
            this.dataset.banTeam = "true"
        }
    }

    if (action === "pick") {
        const currentContainer = team === "red" ? leftTeamPickContainerEl : rightTeamPickContainerEl

        // Get current tile
        let currentTile
        for (let i = 0; i < currentContainer.childElementCount; i++) {
            if (currentContainer.children[i].hasAttribute("data-id")) continue
            currentTile = currentContainer.children[i]
            break
        }
        if (!currentTile) return

        currentPickTile = currentTile
        currentTile.dataset.id = currentMap.beatmap_id
        currentTile.children[0].style.backgroundImage =  `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
        currentTile.children[1].style.display = "block"
        currentTile.children[1].children[0].innerText = `${currentMap.mod}${currentMap.order}`

        document.cookie = `currentPicker=${team}; path=/`
        currentPickMap = currentMap

        this.dataset.pickTeam = "true"

        updateCurrentPicker(team === "red" ? "left" : "right")

        // If map is picked
        await delay(5600)
        if (enableAutoAdvance && isStarOn) {
            obsGetCurrentScene((currentScene) => {
                if (currentScene.name === gameplay_scene_name) return
                obsSetCurrentScene(gameplay_scene_name)
            })
        }
    }
}

// Team Stars
const leftTeamStarContainerEl = document.getElementById("left-team-star-container")
const rightTeamStarContainerEl = document.getElementById("right-team-star-container")
/**
 * Creates the star display
 */
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

    let currentWinner = currentLeftStars > currentRightStars ? leftTeamName : currentRightStars > currentLeftStars ? rightTeamName : "no one"
    let currentWinnerSide = currentLeftStars > currentRightStars ? "left" : currentRightStars > currentLeftStars ? "right" : "no one"
    document.cookie = `currentLeftStars=${currentLeftStars}; path=/`
    document.cookie = `currentRightStars=${currentRightStars}; path=/`
    document.cookie = `currentFirstTo=${currentFirstTo}; path=/`
    document.cookie = `currentWinner=${currentWinner}; path=/`
    document.cookie = `currentWinnerSide=${currentWinnerSide}; path=/`
}

/**
 * Updates the star count
 * @param {string} team - Left or right side
 * @param {string} action - Plus or minus
 */
function updateStarCount(team, action) {
    if (team === "red" && action === "plus") currentLeftStars++
    else if (team === "red" && action === "minus") currentLeftStars--
    else if (team === "blue" && action === "plus") currentRightStars++
    else if (team === "blue" && action === "minus") currentRightStars--

    if (currentLeftStars > currentFirstTo) currentLeftStars = currentFirstTo
    if (currentLeftStars < 0) currentLeftStars = 0
    if (currentRightStars > currentFirstTo) currentRightStars = currentFirstTo
    if (currentRightStars < 0) currentRightStars = 0

    createStarDisplay()

    if (currentLeftStars > currentRightStars) {
        document.cookie=`currentWinningTeam=${leftTeamName}; path=/`
        document.cookie=`currentWinningColour=red; path=/`
    } else if (currentLeftStars < currentRightStars) {
        document.cookie=`currentWinningTeam=${rightTeamName}; path=/`
        document.cookie=`currentWinningColour=blue; path=/`
    } else {
        document.cookie=`currentWinningTeam=none; path=/`
        document.cookie=`currentWinningColour=none; path=/`
    }
}

// Team Names
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
let leftTeamName, rightTeamName

// Autopicking / beatmap stuff
let mapId, mapChecksum

// Scores
let currentLeftScore, currentRightScore, currentLeftSecondaryScore, currentRightSecondaryScore
let ipcState, checkedWinner = false

// Chat display container
const messagesContainerEl = document.getElementById("messages-container")
let chatLen = 0

// Socket
const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)

    // Teams
    if (leftTeamName !== data.tourney.team.left) {
        leftTeamName = data.tourney.team.left
        leftTeamNameEl.innerText = leftTeamName
    }
    if (rightTeamName !== data.tourney.team.right) {
        rightTeamName = data.tourney.team.right
        rightTeamNameEl.innerText = rightTeamName
    }

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

    if (mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        const currentMap = document.getElementById(mapId)

        if (currentMap && currentMap.dataset.pickTeam === "false" && currentMap.dataset.banTeam === "false" && isAutopickOn && nextPicker) {
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (nextPicker === "blue")? 2 : 0,
            })
            currentMap.dispatchEvent(event)

            if (nextPicker === "red") updateNextAutoPicker("blue")
            else if (nextPicker === "blue") updateNextAutoPicker("red")
        }
    }

    // Scores
    if (ipcState === 2 || ipcState === 3) {
        currentLeftScore = 0
        currentRightScore = 0

        // Get scores for each team
        for (let i = 0; i < data.tourney.clients.length; i++) {
            let currentPlay = data.tourney.clients[i].play
            let currentMods = getMods(currentPlay.mods.number)
            currentPlay.score *= currentMods.includes("EZ") ? 1.75 : 1
            data.tourney.clients[i].team === "left" ? currentLeftScore += currentPlay.score : currentRightScore += currentPlay.score
        }
    }

    if (ipcState !== data.tourney.ipcState) {
        ipcState = data.tourney.ipcState

        if (ipcState !== 4) checkedWinner = false
        if (ipcState === 4 && !checkedWinner) {
            checkedWinner = true

            if (!isStarOn) return
            let winner = ""
            if (currentLeftScore > currentRightScore) winner = "red"
            else if (currentLeftScore < currentRightScore) winner = "blue"

            if (!winner) return
            updateStarCount(winner, "plus")

            // Delay 10 sedconds
            await delay(15000)
            if (enableAutoAdvance && isStarOn && (currentLeftStars === currentFirstTo || currentRightStars === currentFirstTo)) {
                obsGetCurrentScene((currentScene) => {
                    if (currentScene.name === winner_scene_name) return
                    obsSetCurrentScene(winner_scene_name)
                })
            } else if (enableAutoAdvance && isStarOn) {
                obsGetCurrentScene((currentScene) => {
                    if (currentScene.name === mappool_scene_name) return
                    obsSetCurrentScene(mappool_scene_name)
                })
            }

            // Set winner on tile
            if (!currentPickTile) return

            if (winner === "red") {
                currentPickTile
            }
        } else {
            if (enableAutoAdvance && (ipcState === 2 || ipcState === 3)) {
                obsGetCurrentScene((currentScene) => {
                    if (currentScene.name === gameplay_scene_name) return
                    obsSetCurrentScene(gameplay_scene_name)
                })
            }
        }
    }
}

// Update next auto picker
const nextAutopickerEl = document.getElementById("next-auto-picker-team")
let nextPicker
function updateNextAutoPicker(team) {
    nextAutopickerEl.innerText = team === "red" ? "Left" : "Right"
    nextPicker = team
}

// Toggle autopick
const toggleAutopickEl = document.getElementById("toggle-autopick")
let isAutopickOn = false
function toggleAutopick() {
    isAutopickOn = !isAutopickOn
    toggleAutopickEl.innerText = `Autopick: ${isAutopickOn? "ON" : "OFF"}`
}

// Toggle Stars
const toggleStarsEl = document.getElementById("toggle-stars")
let isStarOn = true
function toggleStars() {
    isStarOn = !isStarOn
    if (isStarOn) {
        leftTeamStarContainerEl.style.display = "flex"
        rightTeamStarContainerEl.style.display = "flex"
        toggleStarsEl.innerText = "Toggle Stars: ON"
    } else {
        leftTeamStarContainerEl.style.display = "none"
        rightTeamStarContainerEl.style.display = "none"
        toggleStarsEl.innerText = "Toggle Stars: OFF"
    }
    document.cookie = `toggleStars=${isStarOn}; path=/`
}
document.cookie = `toggleStars=${isStarOn}; path=/`

// Mappool Management System
const mappoolManagementSystemEl = document.getElementById("mappool-management-system")
const mappoolManagementSetActionEl = document.getElementById("mappool-management-set-action")
let mappoolManagementAction
function mappoolManagementSetAction() {
    mappoolManagementAction = mappoolManagementSetActionEl.value
    
    // Remove all other elements
    while (mappoolManagementSystemEl.childElementCount > 2) {
        mappoolManagementSystemEl.lastChild.remove()
    }

    // Remove all variables
    mappoolManagementSetWhoseBanTeam = undefined
    mappoolManagementSetWhoseBanNumber = undefined
    mappoolManagementSelectedMap = undefined
    mappoolManagementSetWhosePickTeam = undefined
    mappoolManagementSetWhosePickNumber = undefined

    // Set Ban
    if (mappoolManagementAction === "setBan" || mappoolManagementAction === "removeBan") {
        // Whose Ban Title
        const whoseBanTitle = document.createElement("div")
        whoseBanTitle.classList.add("sidebar-title")
        whoseBanTitle.innerText = "Whose Ban?"

        // Get number of bans from each team
        let currentLeftBanNumberTotal = mappoolManagementAction === "setBan"? Math.min(leftTeamBanContainerEl.childElementCount + 1, 2) : leftTeamBanContainerEl.childElementCount
        let currentRightBanNumberTotal = mappoolManagementAction === "setBan"? Math.min(rightTeamBanContainerEl.childElementCount + 1, 2) : rightTeamBanContainerEl.childElementCount

        // If there are no bans (removeBan only)
        if (currentLeftBanNumberTotal + currentRightBanNumberTotal === 0) {
            const sidebarText = document.createElement("div")
            sidebarText.classList.add("sidebar-text")
            sidebarText.innerText = "Please set some bans first!"
            mappoolManagementSystemEl.append(sidebarText)
            return
        }

        // Create select 
        const mappoolManagementWhoseBanSelect = document.createElement("select")
        mappoolManagementWhoseBanSelect.classList.add("sidebar-select")
        mappoolManagementWhoseBanSelect.setAttribute("id", "mappool-management-set-whose-ban")
        const totalBans = currentLeftBanNumberTotal + currentRightBanNumberTotal
        const mappoolManagementWhoseBanSelectSize = (totalBans < 2 && mappoolManagementAction === "removeBan")? 2 : totalBans
        mappoolManagementWhoseBanSelect.setAttribute("size", mappoolManagementWhoseBanSelectSize)
        mappoolManagementWhoseBanSelect.setAttribute("onchange", "mappoolManagementSetWhoseBan()")
        // Get Bans
        let i = 0
        for (i = 0; i < currentLeftBanNumberTotal; i++) {
            const mappoolManagementWhoseBanOption = document.createElement("option")
            mappoolManagementWhoseBanOption.setAttribute("value", `red|${i}`)
            if (i < leftTeamBanContainerEl.childElementCount) mappoolManagementWhoseBanOption.innerText = `Red Ban ${i + 1} - ${leftTeamBanContainerEl.children[i].innerText}`
            else mappoolManagementWhoseBanOption.innerText = `Red Ban ${i + 1}`

            mappoolManagementWhoseBanSelect.append(mappoolManagementWhoseBanOption)
        }
        for (i = 0; i < currentRightBanNumberTotal; i++) {
            const mappoolManagementWhoseBanOption = document.createElement("option")
            mappoolManagementWhoseBanOption.setAttribute("value", `green|${i}`)
            if (i < rightTeamBanContainerEl.childElementCount) mappoolManagementWhoseBanOption.innerText = `Green Ban ${i + 1} - ${rightTeamBanContainerEl.children[i].innerText}`
            else mappoolManagementWhoseBanOption.innerText = `Green Ban ${i + 1}`

            mappoolManagementWhoseBanSelect.append(mappoolManagementWhoseBanOption)
        }

        mappoolManagementSystemEl.append(whoseBanTitle, mappoolManagementWhoseBanSelect)

        if (mappoolManagementAction === "setBan") {
            // Which Map?
            const whichMapTitle = document.createElement("div")
            whichMapTitle.classList.add("sidebar-title")
            whichMapTitle.innerText = "Which Map?"

            const mappoolManagementWhichMapButtonContainer = document.createElement("div")
            mappoolManagementWhichMapButtonContainer.setAttribute("id", "mappool-management-which-ban-button-container")
            mappoolManagementWhichMapButtonContainer.classList.add("sidebar-mappool-management-button-container")

            for (let i = 0; i < allBeatmaps.length; i++) {
                const mappoolManagementWhichMapButton = document.createElement("div")
                mappoolManagementWhichMapButton.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
                mappoolManagementWhichMapButton.addEventListener("click", mappoolManagementSetMap)
                mappoolManagementWhichMapButton.dataset.id = allBeatmaps[i].beatmap_id
                mappoolManagementWhichMapButtonContainer.append(mappoolManagementWhichMapButton)
            }

            mappoolManagementSystemEl.append( whichMapTitle, mappoolManagementWhichMapButtonContainer)
        }
    }

    // Set Pick
    if (mappoolManagementAction === "setPick" || mappoolManagementAction === "removePick") {
        // Whose Pick Title
        const whosePickTitle = document.createElement("div")
        whosePickTitle.classList.add("sidebar-title")
        whosePickTitle.innerText = "Whose Pick?"

        // Create select 
        const mappoolManagementWhosePickSelect = document.createElement("select")
        mappoolManagementWhosePickSelect.classList.add("sidebar-select")
        mappoolManagementWhosePickSelect.setAttribute("id", "mappool-management-set-whose-pick")
        mappoolManagementWhosePickSelect.setAttribute("size", (currentFirstTo - 1) * 2)
        mappoolManagementWhosePickSelect.setAttribute("onchange", "mappoolManagementSetWhosePick()")

        // Create options
        for (i = 0; i < leftTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `red|${i}`)
            if (leftTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Red Pick ${i + 1} - ${leftTeamPickContainerEl.children[i].children[1].children[0].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Red Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }
        for (i = 0; i < rightTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `green|${i}`)
            if (rightTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1} - ${rightTeamPickContainerEl.children[i].children[1].children[0].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }

        mappoolManagementSystemEl.append( whosePickTitle, mappoolManagementWhosePickSelect)

        if (mappoolManagementAction === "setPick") {
            // Which Map?
            const whichMapTitle = document.createElement("div")
            whichMapTitle.classList.add("sidebar-title")
            whichMapTitle.innerText = "Which Map?"

            const mappoolManagementWhichMapButtonContainer = document.createElement("div")
            mappoolManagementWhichMapButtonContainer.setAttribute("id", "mappool-management-which-ban-button-container")
            mappoolManagementWhichMapButtonContainer.classList.add("sidebar-mappool-management-button-container")

            for (let i = 0; i < allBeatmaps.length; i++) {
                const mappoolManagementWhichMapButton = document.createElement("div")
                mappoolManagementWhichMapButton.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
                mappoolManagementWhichMapButton.addEventListener("click", mappoolManagementSetMap)
                mappoolManagementWhichMapButton.dataset.id = allBeatmaps[i].beatmap_id
                mappoolManagementWhichMapButtonContainer.append(mappoolManagementWhichMapButton)
            }

            mappoolManagementSystemEl.append( whichMapTitle, mappoolManagementWhichMapButtonContainer)
        }
    } 
    // Set Pick
    if (mappoolManagementAction === "setWinner" || mappoolManagementAction === "removeWinner") {
        // Whose Pick Title
        const whosePickTitle = document.createElement("div")
        whosePickTitle.classList.add("sidebar-title")
        whosePickTitle.innerText = "Whose Pick?"

        // Create select 
        const mappoolManagementWhosePickSelect = document.createElement("select")
        mappoolManagementWhosePickSelect.classList.add("sidebar-select")
        mappoolManagementWhosePickSelect.setAttribute("id", "mappool-management-set-whose-pick")
        mappoolManagementWhosePickSelect.setAttribute("size", (currentFirstTo - 1) * 2)
        mappoolManagementWhosePickSelect.setAttribute("onchange", "mappoolManagementSetWhosePick()")

        // Create options
        for (i = 0; i < leftTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `red|${i}`)
            if (leftTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Red Pick ${i + 1} - ${leftTeamPickContainerEl.children[i].children[1].children[0].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Red Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }
        for (i = 0; i < rightTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `green|${i}`)
            if (rightTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1} - ${rightTeamPickContainerEl.children[i].children[1].children[0].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }

        mappoolManagementSystemEl.append( whosePickTitle, mappoolManagementWhosePickSelect)

        if (mappoolManagementAction === "setWinner") {
            // Which Map?
            const whichTeamTitle = document.createElement("div")
            whichTeamTitle.classList.add("sidebar-title")
            whichTeamTitle.innerText = "Which Team?"

            const mappoolManagementWhichTeamContainer = document.createElement("select")
            mappoolManagementWhichTeamContainer.classList.add("sidebar-select")
            mappoolManagementWhichTeamContainer.setAttribute("id", "mappool-management-set-which-team")
            mappoolManagementWhichTeamContainer.setAttribute("onchange", "mappoolManagementSetWhichTeam()")
            mappoolManagementWhichTeamContainer.setAttribute("size", 2)

            const mappoolManagementWhichTeamOptionOne = document.createElement("option")
            mappoolManagementWhichTeamOptionOne.setAttribute("value", "red")
            mappoolManagementWhichTeamOptionOne.innerText = "Red"
            const mappoolManagementWhichTeamOptionTwo = document.createElement("option")
            mappoolManagementWhichTeamOptionTwo.setAttribute("value", "green")
            mappoolManagementWhichTeamOptionTwo.innerText = "Green"

            mappoolManagementWhichTeamContainer.append(mappoolManagementWhichTeamOptionOne, mappoolManagementWhichTeamOptionTwo)

            mappoolManagementSystemEl.append( whichTeamTitle, mappoolManagementWhichTeamContainer)
        }
    }

    // Apply Changes Button
    const applyChangesButtonContainer = document.createElement("div")
    applyChangesButtonContainer.classList.add("sidebar-button-container")

    const applyChangesButton = document.createElement("button")
    applyChangesButton.classList.add("full-length-button")
    applyChangesButton.innerText = "Apply Changes"

    switch (mappoolManagementAction) {
        case "setBan":
            applyChangesButton.addEventListener("click", mappoolManagementSetBan)
            break
        case "removeBan":
            applyChangesButton.addEventListener("click", mappoolManagementRemoveBan)
            break
        case "setPick":
            applyChangesButton.addEventListener("click", mappoolManagementSetPick)
            break
        case "removePick":
            applyChangesButton.addEventListener("click", mappoolManagementRemovePick)
            break
        case "setWinner":
            applyChangesButton.addEventListener("click", mappoolManagementSetWinner)
            break
        case "removeWinner":
            applyChangesButton.addEventListener("click", mappoolManagementRemoveWinner)
            break
    }
    
    applyChangesButtonContainer.append(applyChangesButton)
    mappoolManagementSystemEl.append(applyChangesButtonContainer)
}

// Mappool Management Whose Ban
let mappoolManagementSetWhoseBanTeam
let mappoolManagementSetWhoseBanNumber
function mappoolManagementSetWhoseBan() {
    const mappoolManagementSetWhoseBanElValue = document.getElementById("mappool-management-set-whose-ban").value
    const mappoolManagementSetWhoseBanElValueSplit = mappoolManagementSetWhoseBanElValue.split("|")
    mappoolManagementSetWhoseBanTeam = mappoolManagementSetWhoseBanElValueSplit[0]
    mappoolManagementSetWhoseBanNumber = Number(mappoolManagementSetWhoseBanElValueSplit[1])
}

// Mappool Management Set Map
let mappoolManagementSelectedMap
function mappoolManagementSetMap() {
    const mappoolManagementWhichMapButtonContainerEl = document.getElementById("mappool-management-which-ban-button-container")
    for (let i = 0; i < mappoolManagementWhichMapButtonContainerEl.childElementCount; i++) {
        mappoolManagementWhichMapButtonContainerEl.children[i].style.backgroundColor = "transparent"
        mappoolManagementWhichMapButtonContainerEl.children[i].style.color = "white"
    }
    this.style.backgroundColor = "#CECECE"
    this.style.color = "black"
    mappoolManagementSelectedMap = this.dataset.id
}

// Check ban count
function mapCurrentlyBannedElsewhereCheck(previousMapId, banRequirement) {
    let banCount = 0
    for (let i = 0; i < leftTeamBanContainerEl.childElementCount; i++) {
        if (leftTeamBanContainerEl.children[i].dataset.id === previousMapId) banCount++
    }
    for (let i = 0; i < rightTeamBanContainerEl.childElementCount; i++) {
        if (rightTeamBanContainerEl.children[i].dataset.id === previousMapId) banCount++
    }
    if (banCount > banRequirement) return true
    return false
}

// Check pick count
function mapCurrentlyPickedElsewhereCheck(previousMapId, pickRequirement) {
    let pickCount = 0
    for (let i = 0; i < leftTeamPickContainerEl.childElementCount; i++) {
        if (leftTeamPickContainerEl.children[i].dataset.id === previousMapId) pickCount++
    }
    for (let i = 0; i < rightTeamPickContainerEl.childElementCount; i++) {
        if (rightTeamPickContainerEl.children[i].dataset.id === previousMapId) pickCount++
    }
    if (pickCount > pickRequirement) return true
    return false
}

// Mappool Management Set Ban
function mappoolManagementSetBan() {
    if (mappoolManagementSetWhoseBanTeam === undefined || mappoolManagementSetWhoseBanNumber === undefined || mappoolManagementSelectedMap === undefined) return

    // Find which map
    const currentMap = findBeatmaps(mappoolManagementSelectedMap)
    if (!currentMap) return

    // Find which container
    const currentContainer = mappoolManagementSetWhoseBanTeam === "red"? leftTeamBanContainerEl : rightTeamBanContainerEl
    if (!currentContainer) return

    // Find if ban number currently exists or not
    let tileExists = false
    if (currentContainer.childElementCount > mappoolManagementSetWhoseBanNumber) tileExists = true

    // If tile does not exist
    if (!tileExists) {
        createBanWrapper(currentMap, currentContainer, mappoolManagementSetWhoseBanTeam === "red" ? "red" : "blue")
        document.getElementById(currentMap.beatmap_id).dataset.banTeam = "true"
    } else {
        const currentTile = currentContainer.children[mappoolManagementSetWhoseBanNumber]
        const previousMapId = currentTile.dataset.id

        // Check if map is currently banned elsewhere
        const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 1)
        
        // Check if map is currently picked elsewhere
        const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 0)

        // Set attributes depending on the above
        const previousMapButton = document.getElementById(previousMapId)
        previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
        previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

        // Set attributes for current map
        currentTile.dataset.id = currentMap.beatmap_id
        currentTile.children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
        currentTile.children[1].innerText = `${currentMap.mod}${currentMap.order}`
    }
}

// Mappool Management Remove Ban
function mappoolManagementRemoveBan() {
    if (mappoolManagementSetWhoseBanTeam === undefined || mappoolManagementSetWhoseBanNumber === undefined) return

    // Find which container
    const currentContainer = mappoolManagementSetWhoseBanTeam === "red"? leftTeamBanContainerEl : rightTeamBanContainerEl
    if (!currentContainer) return

    // Find which tile
    const currentTile = currentContainer.children[mappoolManagementSetWhoseBanNumber]
    const previousMapId = currentTile.dataset.id
    if (!currentTile) return

    // Check if map is currently banned elsewhere
    const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 1)
    
    // Check if map is currently picked elsewhere
    const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 0)

    // Set attributes depending on the above
    const previousMapButton = document.getElementById(previousMapId)
    previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
    previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

    // Remove tile
    currentTile.remove()
}

// Mappool Management Set Whose Pick
let mappoolManagementSetWhosePickTeam
let mappoolManagementSetWhosePickNumber
function mappoolManagementSetWhosePick() {
    const mappoolManagementSetWhosePickElValue = document.getElementById("mappool-management-set-whose-pick").value
    const mappoolManagementSetWhosePickElValueSplit = mappoolManagementSetWhosePickElValue.split("|")
    mappoolManagementSetWhosePickTeam = mappoolManagementSetWhosePickElValueSplit[0]
    mappoolManagementSetWhosePickNumber = Number(mappoolManagementSetWhosePickElValueSplit[1])
}

// Mappool Management Set Pick
function mappoolManagementSetPick() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined || mappoolManagementSelectedMap === undefined) return

    // Find which map
    const currentMap = findBeatmaps(mappoolManagementSelectedMap)
    if (!currentMap) return

    // Find which container
    const currentContainer = mappoolManagementSetWhosePickTeam === "red"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return

    // Find if ban number currently exists or not
    let tileExists = false
    if (currentContainer.children[mappoolManagementSetWhosePickNumber].hasAttribute("data-id")) tileExists = true

    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]

    if (tileExists) {
        const previousMapId = currentTile.dataset.id

        // Check if map is currently banned elsewhere
        const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 0)
        
        // Check if map is currently picked elsewhere
        const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 1)

        // Set attributes depending on the above
        const previousMapButton = document.getElementById(previousMapId)
        previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
        previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"
    }

    currentTile.dataset.id = currentMap.beatmap_id
    currentTile.children[0].style.backgroundImage =  `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
    currentTile.children[1].style.display = "block"
    currentTile.children[1].children[0].innerText = `${currentMap.mod}${currentMap.order}`
    document.getElementById(`${currentMap.beatmap_id}`).dataset.pickTeam = "true"
}

function mappoolManagementRemovePick() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined) return

    // Find which container
    const currentContainer = mappoolManagementSetWhosePickTeam === "red"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return

    // Find if ban number currently exists or not
    let tileExists = false
    if (currentContainer.children[mappoolManagementSetWhosePickNumber].hasAttribute("data-id")) tileExists = true
    if (!tileExists) return

    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]
    const previousMapId = currentTile.dataset.id

    // Check if map is currently banned elsewhere
    const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 0)
    
    // Check if map is currently picked elsewhere
    const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 1)

    // Set attributes depending on the above
    const previousMapButton = document.getElementById(previousMapId)
    previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
    previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

    currentTile.removeAttribute("data-id")
    currentTile.children[0].style.backgroundImage = ""
    currentTile.children[1].style.display = "none"
    currentTile.children[1].children[0].innerText = ""
}

// Mappool Management Set Which Team
let mappoolManagementSetWhichTeamTeam
function mappoolManagementSetWhichTeam() {
    mappoolManagementSetWhichTeamTeam = document.getElementById("mappool-management-set-which-team").value
}

// Mappool Managemnt Set Winner
function mappoolManagementSetWinner() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined || mappoolManagementSetWhichTeamTeam === undefined) return

    // Find which container
    const currentContainer = mappoolManagementSetWhosePickTeam === "red"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return
    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]
    currentTile.style.backgroundColor = `var(--${mappoolManagementSetWhichTeamTeam === "red" ? "left" : "right"}-colour)`
    currentTile.children[0].style.opacity = 0.4
    currentTile.children[1].classList.remove(`${mappoolManagementSetWhichTeamTeam === "red" ? "right" : "left" }-team-pick-bottom-section`)
    currentTile.children[1].classList.add(`${mappoolManagementSetWhichTeamTeam === "red" ? "left" : "right" }-team-pick-bottom-section`)
}

// Mappool Managemnt Set Winner
function mappoolManagementRemoveWinner() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined) return

    // Find which container'
    const currentContainer = mappoolManagementSetWhosePickTeam === "red"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return
    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]

    currentTile.style.backgroundColor = `var(--${mappoolManagementSetWhosePickTeam === "red" ? "left" : "right"}-colour)`
    currentTile.children[0].style.opacity = 1
    currentTile.children[1].classList.remove(`${mappoolManagementSetWhosePickTeam === "red" ? "right" : "left"}-team-pick-bottom-section`)
    currentTile.children[1].classList.add(`${mappoolManagementSetWhosePickTeam === "red" ? "left" : "right"}-team-pick-bottom-section`)
}

// OBS Information
const sceneCollection = document.getElementById("sceneCollection")
let autoadvance_button = document.getElementById('auto-advance-button')
let autoadvance_timer_label = document.getElementById('autoAdvanceTimerLabel')
const pick_to_transition_delay_ms = 10000
const gameplay_scene_name = "Gameplay"
const mappool_scene_name = "Mappool"
const winner_scene_name = "Winner"

let sceneTransitionTimeoutID

function switchAutoAdvance() {
    enableAutoAdvance = !enableAutoAdvance
    if (enableAutoAdvance) {
        autoadvance_button.innerText = 'Auto Advance: ON'
        autoadvance_button.classList.add("toggle-active")
        autoadvance_button.classList.remove("toggle-inactive")
    } else {
        autoadvance_button.innerText = 'Auto Advance: OFF'
        autoadvance_button.classList.remove("toggle-active")
        autoadvance_button.classList.add("toggle-inactive")
    }
}

const obsGetCurrentScene = window.obsstudio?.getCurrentScene ?? (() => {})
const obsGetScenes = window.obsstudio?.getScenes ?? (() => {})
const obsSetCurrentScene = window.obsstudio?.setCurrentScene ?? (() => {})

obsGetScenes(scenes => {
    for (const scene of scenes) {
        let clone = document.getElementById("sceneButtonTemplate").content.cloneNode(true)
        let buttonNode = clone.querySelector('button')
        buttonNode.id = `scene__${scene}`
        buttonNode.textContent = `GO TO: ${scene}`
        buttonNode.onclick = function() { obsSetCurrentScene(scene); }
        sceneCollection.appendChild(clone)
    }

    obsGetCurrentScene((scene) => { document.getElementById(`scene__${scene.name}`).classList.add("active-scene") })
})

window.addEventListener('obsSceneChanged', function(event) {
    let activeButton = document.getElementById(`scene__${event.detail.name}`)
    for (const scene of sceneCollection.children) { scene.classList.remove("toggle-active") }
    activeButton.classList.add("toggle-active")
})