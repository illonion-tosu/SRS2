// Variables
const EZ_MULTIPLIER = 1.75

// Team Name Variables
const teamNameLeftEl = document.getElementById("team-name-left")
const teamNameRightEl = document.getElementById("team-name-right")
let currentTeamNameLeft, currentTeamNameRight

// Now Playing
const nowPlayingBannerEl = document.getElementById("now-playing-banner")
const nowPlayingTitleDifficultyEl = document.getElementById("now-playing-title-difficulty")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
let currentBeatmapId, currentBeatmapChecksum

// Spclet
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team Names
    if (currentTeamNameLeft !== data.tourney.team.left) {
        currentTeamNameLeft = data.tourney.team.left
        teamNameLeftEl.textContent = currentTeamNameLeft
    }
    if (currentTeamNameRight !== data.tourney.team.right) {
        currentTeamNameRight = data.tourney.team.right
        teamNameRightEl.textContent = currentTeamNameRight
    }

    if (currentBeatmapId !== data.beatmap.id || currentBeatmapChecksum !== data.beatmap.checksum) {
        currentBeatmapId = data.beatmap.id
        currentBeatmapChecksum = data.beatmap.checksum

        nowPlayingBannerEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`
        nowPlayingTitleDifficultyEl.textContent = `${data.beatmap.title} [${data.beatmap.version}]`
        nowPlayingArtistEl.textContent = data.beatmap.artist
    }
}