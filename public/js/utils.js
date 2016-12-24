/* eslint no-unused-vars:off */
function showTooltip(element) {
    const e = element.nextSibling;
    e.className = e.className.replace('hidden', '');
}

function hideTooltip(element) {
    const e = element.nextSibling;
    e.className += 'hidden';
}
