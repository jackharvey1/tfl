/* eslint no-var: off, vars-on-top:off, no-undef: off, no-unused-vars:off, init-declarations: off */

var markers = [];
var map;

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

function init() {
    fetchStations().then((stations) => {
        return new Promise((resolve) => {
            map = L.map('map', { zoomControl: false });

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();

            var stationIcon = L.icon({
                iconUrl: '/img/circle.png',
                iconSize: [6, 6],
                iconAnchor: [3, 3],
                popupAnchor: [3, 0]
            });

            L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            for (let s = 0; s < stations.length; s++) {
                markers.push(L.marker([stations[s].lat, stations[s].lon], {icon: stationIcon}));
                markers[s].addTo(map);
            }
            resolve();
        });
    }).then(() => {
        fetchStationStats().then((stats) => {
            map.fitBounds([
                [stats.lat.max, stats.lon.min],
                [stats.lat.min, stats.lon.max]
            ]);
        });
    });

    fetchLines().then((lines) => {
        fetchRoutes().then((routes) => {
            for (var i = 0; routes.length; i++) {
                for (var j = 0; j < routes[i].pointGroups.length; j++) {
                    var colour = getLineColour(lines, routes[i].line);
                    L.polyline(routes[i].pointGroups[j], { color: colour }).addTo(map);
                }
            }
        });
    });
}
