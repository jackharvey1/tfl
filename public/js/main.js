/* eslint no-var: off, vars-on-top:off, no-undef: off, no-unused-vars:off, init-declarations: off */

var map;
var socket;

var markers = [];
var bounds;

var lineWidth = 3;

var stationIcon = L.icon({
    iconUrl: '/img/circle.png',
    iconSize: [8, 8],
    iconAnchor: [4, 4],
    popupAnchor: [4, 0]
});

var blinkIcon = L.icon({
    iconUrl: '/img/circle-blink.png',
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

function createStationMarkers(stations, icon) {
    for (let s = 0; s < stations.length; s++) {
        markers.push(L.marker(stations[s], { icon }));
        markers[s].addTo(map);
        markers[s].stationId = stations[s].stationId;
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
    createMap();
    makeMapStatic();
    fetch('/stations/all').then((stations) => {
        return new Promise((resolve) => {
            createStationMarkers(stations, stationIcon);
            resolve();
        });
    }).then(() => {
        fetch('/bounds').then((stats) => {
            bounds = [
                [stats.lat.max, stats.lon.min],
                [stats.lat.min, stats.lon.max]
            ];
            fitMapToBounds();
            window.onresize = fitMapToBounds;
        });
    }).then(initiateSocketListener());

    fetch('/lines').then((lines) => {
        fetch('/routes').then((routes) => {
            drawLines(lines, routes);
        });
    });

}

function initiateSocketListener() {
    socket = io();

    socket.on('arrivals', function (arrivals) {
        if (arrivals.length > 0) {
            blinkIconsForArrivals(arrivals);
        }
    });
}

function blinkIconsForArrivals(arrivals) {
    arrivals.forEach((arrival) => {
        const marker = markers.find((marker) => {
            return marker.stationId === arrival.stationId;
        });

        marker.setIcon(blinkIcon);

        setTimeout(() => {
            marker.setIcon(stationIcon);
        }, 1500);
    });
}
