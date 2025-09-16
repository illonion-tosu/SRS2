// Get Beatmaps
let allBeatmaps
async function getBeatmaps() {
    const response = await axios.get("../../_data/beatmaps.json")
    allBeatmaps = response.data.beatmaps
}
getBeatmaps()
// Find Beatmaps
const findBeatmaps = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))

// Now Playing
const nowPlayingBannerEl = document.getElementById("now-playing-banner")
const nowPlayingTitleDifficultyEl = document.getElementById("now-playing-title-difficulty")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
let currentBeatmapId, currentBeatmapChecksum, currentMappoolBeatmap
// Now Playing Stats
const nowPlayingSrEl = document.getElementById("now-playing-sr")
const nowPlayingCsEl = document.getElementById("now-playing-cs")
const nowPlayingBpmEl = document.getElementById("now-playing-bpm")
const nowPlayingArEl = document.getElementById("now-playing-ar")
const nowPlayingHpEl = document.getElementById("now-playing-hp")
const nowPlayingLenEl = document.getElementById("now-playing-len")

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

    if ((currentBeatmapId !== data.beatmap.id || currentBeatmapChecksum !== data.beatmap.checksum) && allBeatmaps) {
        currentBeatmapId = data.beatmap.id
        currentBeatmapChecksum = data.beatmap.checksum

        // Metadata
        nowPlayingBannerEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`
        nowPlayingTitleDifficultyEl.textContent = `${data.beatmap.title} [${data.beatmap.version}]`
        nowPlayingArtistEl.textContent = data.beatmap.artist

        // Find beatmap
        currentMappoolBeatmap = findBeatmaps(currentBeatmapId)
        if (currentMappoolBeatmap) {
            const allStats = getStats(
                Math.round(Number(currentMappoolBeatmap.difficultyrating) * 100) / 100,
                Number(currentMappoolBeatmap.diff_approach),
                Number(currentMappoolBeatmap.diff_size),
                Number(currentMappoolBeatmap.diff_drain),
                Number(currentMappoolBeatmap.bpm),
                Number(currentMappoolBeatmap.total_length),
                currentMappoolBeatmap.mod,
                currentMappoolBeatmap.second_mod
            )

            nowPlayingSrEl.textContent = `${allStats.sr}*`
            nowPlayingCsEl.textContent = allStats.cs
            nowPlayingBpmEl.textContent = allStats.bpm
            nowPlayingArEl.textContent = allStats.ar
            nowPlayingHpEl.textContent = allStats.hp
            nowPlayingLenEl.textContent = setLengthDisplay(allStats.len)
        }
    }

    if (!currentMappoolBeatmap) {
        nowPlayingSrEl.textContent = `${data.beatmap.stats.stars.total}*`
        nowPlayingCsEl.textContent = data.beatmap.stats.cs.converted
        nowPlayingBpmEl.textContent = data.beatmap.stats.bpm.common
        nowPlayingArEl.textContent = data.beatmap.stats.ar.converted
        nowPlayingHpEl.textContent = data.beatmap.stats.hp.converted
        nowPlayingLenEl.textContent = setLengthDisplay(Math.round((data.beatmap.time.lastObject - data.beatmap.time.firstObject) / 1000))
    }
}

const nowPlayingBackgroundEl = document.getElementById("now-playing-background")
let previousPicker
setInterval(() => {
    // Set current picker
    const currentPicker = getCookie("currentPicker")
    if (previousPicker !== currentPicker) {
        if (currentPicker === "") currentPicker === "left"
        previousPicker = currentPicker
        nowPlayingBackgroundEl.setAttribute("src", `static/now-playing/${currentPicker}-now-playing-background.png`)
        nowPlayingTitleDifficultyEl.style.color = `var(--color-${currentPicker})`
        nowPlayingArtistEl.style.color = `var(--color-${currentPicker})`
    }
})