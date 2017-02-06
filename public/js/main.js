/* eslint no-var: off, vars-on-top:off, no-undef: off, no-unused-vars:off, init-declarations: off */

let map;
let socket;

let bounds, stations, lines, routes;
const markers = [];

const lineWidth = 3;
const markerSize = 8;
const overlappingZoom = 11;

let currentIcon;

const blankIcon = L.icon({
    iconUrl: '/img/blank.png',
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize / 2]
});

const stationIcon = L.icon({
    iconUrl: '/img/circle.png',
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize / 2]
});

const blinkIcon = L.icon({
    iconUrl: '/img/circle-blink.png',
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize / 2]
});

function fetch(url) {
    return new Promise((resolve) => {
        $.ajax(url).done((data) => {
            resolve(data);
        });
    });
}

function createStationMarkers(stations) {
    currentIcon = map.getZoom() > overlappingZoom ? stationIcon : blankIcon;

    for (let s = 0; s < stations.length; s++) {
        markers.push(L.marker(stations[s], { icon: currentIcon }));
        markers[s].addTo(map);
        markers[s].stationId = stations[s].stationId;
        markers[s].stationName = stations[s].stationName;
        markers[s].bindPopup(`${markers[s].stationName}`);
    }

    instantiateDynamicIcons();
}

function instantiateDynamicIcons() {
    map.on('zoomend', () => {
        if (map.getZoom() > overlappingZoom) {
            currentIcon = stationIcon;
        } else {
            currentIcon = blankIcon;
        }

        markers.forEach((marker) => {
            marker.setIcon(currentIcon);
        });
    });
}

function drawLines(lines, routes) {
    for (var i = 0; i < routes.length; i++) {
        var lineCount = routes[i].lines.length;
        var offsetStart = (lineWidth * (lineCount - 1)) / lineCount;
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
    map = L.map('map', {
        center: bounds.getCenter(),
        maxBounds: bounds
    });

    map.fitBounds(bounds);

    L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.scrollWheelZoom.disable();
}

window.onload = function() {
    fetch('/bounds').then((stats) => {
        bounds = new L.LatLngBounds([
            [stats.lat.max + 0.01, stats.lon.max + 0.01],
            [stats.lat.min - 0.01, stats.lon.min - 0.01]
        ]);

        createMap();
    })
    .then(fetch('/stations/all')
        .then((stations) => {
            return new Promise((resolve) => {
                createStationMarkers(stations, stationIcon);
                resolve();
            });
        })
    )
    .then(fetch('/lines').then((lines) => {
        fetch('/routes').then((routes) => {
            drawLines(lines, routes);
        });
    }))
    .then(initiateSocketListener);
};

function initiateSocketListener() {
    socket = io();

    socket.on('arrivalsNow', (arrivals) => {
        if (arrivals.length > 0) {
            blinkIconsForArrivals(arrivals);
        }
    });

    socket.on('stationArrivals', (arrivals) => {
        updateStationPopups(arrivals);
    });
}

function updateStationPopups(arrivals) {
    arrivals.forEach((arrival) => {
        const marker = markers.find((marker) => {
            return marker.stationId === arrival.stationId;
        });

        let time = arrival.time;
        if (time !== 'N/A') {
            time = new Date(arrival.time);
            time = time.toLocaleTimeString();
        }

        marker._popup.setContent(`Station: ${marker.stationName}<br />Next arrival: ${time}`);
    });
}

function getLineColour(lines, line) {
    for (var l = 0; l < lines.length; l++) {
        if (lines[l].id === line) {
            return lines[l].colour;
        }
    }
}


function blinkIconsForArrivals(arrivals) {
    arrivals.forEach((arrival) => {
        const marker = markers.find((marker) => {
            return marker.stationId === arrival.stationId;
        });

        const delay = Math.random() * 500;

        marker._popup.setContent(`Station: ${marker.stationName}<br />Next arrival: N/A`);

        setTimeout(() => marker.setIcon(blinkIcon), delay);
        setTimeout(() => marker.setIcon(currentIcon), delay + 500);
    });
}
