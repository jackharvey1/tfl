/* eslint no-var: off, vars-on-top:off, no-undef: off, no-unused-vars:off, init-declarations: off */

var markers = [];
var map;
var bounds;

var lineWidth = 3;

var stationIcon = L.icon({
    iconUrl: '/img/circle.png',
    iconSize: [8, 8],
    iconAnchor: [4, 4],
    popupAnchor: [4, 0]
});

function fetch(url) {
    return new Promise((resolve) => {
        $.ajax(url).done((data) => {
            resolve(data);
        });
    });
}

function makeMapStatic() {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
}

function fitMapToBounds() {
    map.fitBounds(bounds);
}

function createMarkers(latLngArray, icon) {
    for (let s = 0; s < latLngArray.length; s++) {
        markers.push(L.marker(latLngArray[s], { icon }));
        markers[s].addTo(map);
    }
}

function drawLines(lines, routes) {
    for (var i = 0; i < routes.length; i++) {
        var lineCount = routes[i].lines.length;
        var offsetStart = (lineWidth * (lineCount - 1)) / 2;
        for (var j = 0; j < lineCount; j++) {
            var colour = getLineColour(lines, routes[i].lines[j]);
            var pl = L.polyline(
                routes[i].pair,
                {
                    color: colour,
                    offset: offsetStart - (j * lineWidth),
                    weight: lineWidth
                }
            ).addTo(map);
        }
    }
}

function createMap() {
    map = L.map('map', { zoomControl: false });

    L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

function init() {
    fetch('/stations/all').then((stations) => {
        return new Promise((resolve) => {
            createMap();
            makeMapStatic();
            createMarkers(stations, stationIcon);
            resolve();
        });
    }).then(() => {
        fetch('/stationStats').then((stats) => {
            bounds = [
                [stats.lat.max, stats.lon.min],
                [stats.lat.min, stats.lon.max]
            ];
            fitMapToBounds();
            window.onresize = fitMapToBounds;
        });
    });

    fetch('/lines').then((lines) => {
        fetch('/routes').then((routes) => {
            drawLines(lines, routes);
        });
    });
}
