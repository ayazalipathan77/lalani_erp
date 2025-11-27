// Geolocation utilities for Lalani ERP

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    address?: string;
}

export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

// Get current location
export const getCurrentLocation = (
    options: GeolocationOptions = {}
): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        const defaultOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            ...options
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                resolve(locationData);
            },
            (error) => {
                let errorMessage = 'Unable to get location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }

                reject(new Error(errorMessage));
            },
            defaultOptions
        );
    });
};

// Watch location changes
export const watchLocation = (
    callback: (location: LocationData) => void,
    errorCallback?: (error: string) => void,
    options: GeolocationOptions = {}
): (() => void) => {
    if (!navigator.geolocation) {
        if (errorCallback) {
            errorCallback('Geolocation is not supported by this browser');
        }
        return () => { };
    }

    const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // 30 seconds
        ...options
    };

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };

            callback(locationData);
        },
        (error) => {
            let errorMessage = 'Unable to watch location';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied by user';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }

            if (errorCallback) {
                errorCallback(errorMessage);
            }
        },
        defaultOptions
    );

    // Return cleanup function
    return () => {
        navigator.geolocation.clearWatch(watchId);
    };
};

// Calculate distance between two points (in kilometers)
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

// Reverse geocode (get address from coordinates)
export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<string> => {
    // Using a free geocoding service (you might want to use a paid service for production)
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        // Build address string
        const addressParts = [
            data.city,
            data.principalSubdivision,
            data.countryName
        ].filter(Boolean);

        return addressParts.join(', ') || 'Unknown location';
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return 'Unable to determine address';
    }
};

// Check if location services are available
export const isGeolocationAvailable = (): boolean => {
    return 'geolocation' in navigator;
};

// Request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
    if (!isGeolocationAvailable()) {
        return false;
    }

    try {
        // Try to get current position to trigger permission request
        await getCurrentLocation({ timeout: 1000 });
        return true;
    } catch (error) {
        return false;
    }
};