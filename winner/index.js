let allTeams
async function getTeams() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    allTeams = responseJson
}
getTeams()

// Find teams
const findTeams = teamName => allTeams.find(team => team.team_name === teamName)

// Main Texts
const matchWinnerTextEl = document.getElementById("match-winner-text") 
const matchTeamNameEl = document.getElementById("match-team-name")

// Players
const playersEl = document.getElementById("players")

// Variables
let previousTeamName, previousWinnerSide
setInterval(() => {
    let currentTeamName = getCookie("currentWinner")
    let currentTeamColour = getCookie("currentWinnerSide")

    // Set winner side
    if (previousWinnerSide !== currentTeamColour) {
        previousWinnerSide = currentTeamColour
        matchWinnerTextEl.style.color = `var(--color-${currentTeamColour})`
        matchTeamNameEl.style.color = `var(--color-${currentTeamColour})`
    }

    if (previousTeamName !== currentTeamName && allTeams) {
        previousTeamName = currentTeamName

        // Check if there is a winner
        if (currentTeamName === "no one") {
            matchTeamNameEl.style.display = "none"
            playersEl.style.display = "none"
            return
        }

        // Change team names
        matchTeamNameEl.textContent = currentTeamName
        matchTeamNameEl.style.display = "block"

        // Get team
        const currentTeam = findTeams(currentTeamName)

        if (currentTeam) {
            playersEl.style.display = "flex"

            let i = 0
            for (i; i < currentTeam.team_players.length; i++) {
                playersEl.children[i].textContent = currentTeam.team_players[i]
                playersEl.children[i].style.display = "block"
            }
            for (i; i < playersEl.childElementCount; i++) {
                playersEl.children[i].style.display = "none"
            }
        } else {
            playersEl.style.display = "none"
        }
    }
}, 200)