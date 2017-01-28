/* eslint no-unused-vars:off */

function getLineColour(lines, line) {
    for (let l = 0; l < lines.length; l++) {
        if (lines[l].id === line) {
            return lines[l].colour;
        }
    }
}
