
/* Text Area */
const textareaEl = document.getElementById("textarea")
let allTeams = []
function submit() {
    let textareaValue = textareaEl.value
    let textareaSplitLine = textareaValue.split("\n")
    allTeams = []
    
    for (let i = 0; i < textareaSplitLine.length; i++) {
        if (/^[^,\s]+$/.test(textareaSplitLine[i])) continue
        const textareaSplitCommas = textareaSplitLine[i].split("\t")
        const team = {
            "team_name": textareaSplitCommas[0],
            "team_players": [textareaSplitCommas[1], textareaSplitCommas[2], textareaSplitCommas[3], textareaSplitCommas[4], textareaSplitCommas[5], textareaSplitCommas[6], textareaSplitCommas[8], textareaSplitCommas[7]]
        }
        allTeams.push(team)
    }
    const teamsStr = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(allTeams, null, 4))
    let teamsAnchor = document.createElement("a")
    teamsAnchor.setAttribute("href", teamsStr)
    teamsAnchor.setAttribute("download", "teams.json")
    teamsAnchor.click()
}