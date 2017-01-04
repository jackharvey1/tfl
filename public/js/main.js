/* eslint no-var: off, vars-on-top:off, no-undef: off, no-unused-vars:off, init-declarations: off */

var markers = [];
var map;

var strokeSize = 3;
var offsetSize = strokeSize;

var bounds;

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

function fetchLines() {
    return fetch('/lines');
}

function fetchStations() {
    return fetch('/stations/all');
}

function fetchRoutes() {
    return fetch('/routes');
}

function fetchStationStats() {
    return fetch('/stationStats');
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

function addStations(stations) {
    for (let s = 0; s < stations.length; s++) {
        markers.push(L.marker([stations[s].lat, stations[s].lon], {icon: stationIcon}));
        markers[s].addTo(map);
    }
}

function drawLines(lines, routes) {
    for (var i = 0; i < routes.length; i++) {
        var lineCount = routes[i].lines.length;
        for (var j = 0; j < lineCount; j++) {
            var colour = getLineColour(lines, routes[i].lines[j]);
            var offsetStart = (-offsetSize * (lineCount - 1)) / 2;
            var pl = L.polyline(
                routes[i].pair,
                {
                    color: colour,
                    offset: offsetStart + (j * offsetSize),
                    weight: strokeSize
                }
            ).addTo(map);
        }
    }
}

function init() {
    fetchStations().then((stations) => {
        return new Promise((resolve) => {
            map = L.map('map', { zoomControl: false });

            makeMapStatic();

            L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            addStations(stations);

            resolve();
        });
    }).then(() => {
        fetchStationStats().then((stats) => {
            bounds = [
                [stats.lat.max, stats.lon.min],
                [stats.lat.min, stats.lon.max]
            ];
            fitMapToBounds();
            window.onresize = fitMapToBounds;
        });
    });

    fetchLines().then((lines) => {
        fetchRoutes().then((routes) => {
            drawLines(lines, routes);
        });
    });
}
