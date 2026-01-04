import { CONFIG } from './data.js';

/**
 * Manages the Map, Markers, and Vectors
 */
export default class TacticalMap {
    constructor(elementId, initialLat, initialLng) {
        this.map = L.map(elementId, {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: false
        }).setView([initialLat, initialLng], CONFIG.zoomLevel);

        L.control.attribution({position: 'bottomright'}).addTo(this.map);

        // Darker map style for "Tactical" feel
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);

        this.markers = [];
        this.routeLine = null;
        this.ghostLines = [];
    }

    clearLayers() {
        // Remove markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Remove route
        if (this.routeLine) {
            this.routeLine.remove();
            this.routeLine = null;
        }

        // Remove ghosts
        this.ghostLines.forEach(line => line.remove());
        this.ghostLines = [];
    }

    renderMarkers(data, onMarkerClick) {
        data.forEach((point) => {
            const icon = L.divIcon({
                className: `journey-marker ${point.type === 'decision' ? 'marker-decision' : ''}`,
                iconSize: [16, 16]
            });

            const marker = L.marker([point.lat, point.lng], { icon: icon })
                .addTo(this.map);

            const el = marker.getElement();
            if (el) {
                el.setAttribute('tabindex', '0');
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', `Select ${point.title}`);

                el.addEventListener('click', () => onMarkerClick(point));
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onMarkerClick(point);
                    }
                });
            }

            marker.pointId = point.id;
            this.markers.push(marker);
        });
    }

    renderRoute(data, isHistorical = true) {
        const latlngs = data.map(d => [d.lat, d.lng]);

        // Active Route
        this.routeLine = L.polyline(latlngs, {
            color: isHistorical ? 'var(--hud-accent)' : 'var(--hud-warning)',
            weight: 3,
            opacity: 0.8,
            dashArray: isHistorical ? '5, 10' : null,
            lineCap: 'round'
        }).addTo(this.map);

        // Fit bounds to route
        if (latlngs.length > 0) {
            this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        }
    }

    renderGhostPath(data) {
        const latlngs = data.map(d => [d.lat, d.lng]);
        const line = L.polyline(latlngs, {
            color: 'rgba(255, 255, 255, 0.2)',
            weight: 2,
            dashArray: '2, 8',
            opacity: 0.5
        }).addTo(this.map);
        this.ghostLines.push(line);
    }

    highlightMarker(index) {
        this.markers.forEach((marker, i) => {
            const el = marker.getElement();
            if (el) {
                if (i === index) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        });
    }

    panTo(lat, lng, immediate = false) {
        if (immediate) {
            this.map.setView([lat, lng], this.map.getZoom(), { animate: false });
        } else {
            this.map.flyTo([lat, lng], CONFIG.zoomLevel, {
                animate: true,
                duration: 1.5
            });
        }
    }
}
