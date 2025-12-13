// Suyang-dong Approximate Bounding Box
// Center roughly: 34.885, 128.625
const SUYANG_BOUNDS = {
    minLat: 34.870,
    maxLat: 34.900,
    minLng: 128.610,
    maxLng: 128.650
};

export const checkInBounds = (lat, lng) => {
    return (
        lat >= SUYANG_BOUNDS.minLat &&
        lat <= SUYANG_BOUNDS.maxLat &&
        lng >= SUYANG_BOUNDS.minLng &&
        lng <= SUYANG_BOUNDS.maxLng
    );
};

export const SUYANG_CENTER = {
    lat: 34.885,
    lng: 128.625
};
