/* eslint no-var: off, no-undef: off, no-unused-vars:off */

var markers = [];

function fetch() {
    return new Promise((resolve) => {
        $.ajax('/mapData').done((data) => {
            resolve(data);
        });
    });
}

function init() {
    fetch().then((data) => {
        var map = L.map('map', { zoomControl: false }).setView([51.505, -0.09], 13);

        var stationIcon = L.icon({
            iconUrl: '/img/circle.png',
            iconSize: [6, 6],
            iconAnchor: [3, 3],
            popupAnchor: [3, 0]
        });

        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();

        L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        data.stations.forEach(function(station, i) {
            markers.push(L.marker([station.lat, station.lon], {icon: stationIcon}));
            markers[i].addTo(map);
        });

        map.fitBounds([
            [data.minimaxes.lat.max, data.minimaxes.lon.min],
            [data.minimaxes.lat.min, data.minimaxes.lon.max]
        ]);
    });
}
