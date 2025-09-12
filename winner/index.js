// Main Texts
const matchWinnerTextEl = document.getElementById("match-winner-text") 
const matchTeamNameEl = document.getElementById("match-team-name")

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
}, 200)