import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapBackground = ({ markers = [], viewCoords = null, myCoords = null }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const myLocationMarker = useRef(null);

    useEffect(() => {
        if (map.current) return;

        // Suyang-dong, Geoje-si coordinates
        const startLng = 128.625;
        const startLat = 34.885;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://demotiles.maplibre.org/style.json',
            center: [startLng, startLat],
            zoom: 15.5,
            pitch: 45,
            bearing: -17.6,
            antialias: true
        });

        map.current.on('load', () => {
            // Add custom marker image (Red for complaints)
            map.current.loadImage('https://docs.maplibre.org/maplibre-gl-js-docs/assets/custom_marker.png', (error, image) => {
                if (error) return;
                if (!map.current.hasImage('custom-marker')) map.current.addImage('custom-marker', image);

                // Initialize empty source for complaints
                map.current.addSource('complaints', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.current.addLayer({
                    'id': 'complaints-point',
                    'type': 'symbol',
                    'source': 'complaints',
                    'layout': {
                        'icon-image': 'custom-marker',
                        'icon-size': 0.7,
                        'icon-anchor': 'bottom',
                        'icon-allow-overlap': true
                    }
                });
            });

            // 3D Buildings - opportunistic add
            try {
                const layers = map.current.getStyle().layers;
                let labelLayerId;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                        labelLayerId = layers[i].id;
                        break;
                    }
                }

                if (map.current.getSource('openmaptiles')) {
                    map.current.addLayer(
                        {
                            'id': '3d-buildings',
                            'source': 'openmaptiles',
                            'source-layer': 'building',
                            'filter': ['==', 'extrude', 'true'],
                            'type': 'fill-extrusion',
                            'minzoom': 15,
                            'paint': {
                                'fill-extrusion-color': '#adb5bd',
                                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
                                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
                                'fill-extrusion-opacity': 0.8
                            }
                        },
                        labelLayerId
                    );
                }
            } catch (e) {
                // Ignore
            }
        });
    }, []);

    // Update complaints markers
    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        if (map.current.getSource('complaints')) {
            const featureCollection = {
                type: 'FeatureCollection',
                features: markers.map(m => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: m.coords
                    },
                    properties: {
                        id: m.id,
                        message: m.message
                    }
                }))
            };
            map.current.getSource('complaints').setData(featureCollection);
        }
    }, [markers]);

    // Handle flyTo viewCoords
    useEffect(() => {
        if (!map.current || !viewCoords) return;

        map.current.flyTo({
            center: viewCoords,
            zoom: 17,
            pitch: 60,
            essential: true
        });
    }, [viewCoords]);

    // Handle My Location Marker
    useEffect(() => {
        if (!map.current) return;

        if (myCoords) {
            if (!myLocationMarker.current) {
                // Create a blue DOM marker for 'Me'
                const el = document.createElement('div');
                el.className = 'my-location-marker';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.backgroundColor = '#3b82f6';
                el.style.borderRadius = '50%';
                el.style.border = '3px solid white';
                el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
                // Add pulse effect via CSS in JS just for simplicity or use class if available
                el.innerHTML = '<div style="position: absolute; width: 100%; height: 100%; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; background-color: #3b82f6; border-radius: 50%; opacity: 0.75; z-index: -1;"></div>';

                myLocationMarker.current = new maplibregl.Marker({ element: el })
                    .setLngLat(myCoords)
                    .addTo(map.current);
            } else {
                myLocationMarker.current.setLngLat(myCoords);
            }
        } else {
            if (myLocationMarker.current) {
                myLocationMarker.current.remove();
                myLocationMarker.current = null;
            }
        }
    }, [myCoords]);

    return (
        <div className="fixed inset-0 w-full h-full z-0">
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 pointer-events-none" />
            <style>{`
        @keyframes ping {
            75%, 100% {
                transform: scale(2);
                opacity: 0;
            }
        }
      `}</style>
        </div>
    );
};

export default MapBackground;
