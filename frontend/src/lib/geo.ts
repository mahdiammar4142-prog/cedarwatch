export function gpsErrorMessage(error?: GeolocationPositionError | null) {
  if (!window.isSecureContext) {
    const httpsUrl = `https://${window.location.host}/map`;
    return `Phones block GPS on http://. Open ${httpsUrl}, tap Advanced → Proceed, allow location, then try again.`;
  }
  if (error?.code === 1) {
    return "Location permission was denied. Allow location for this site in your phone browser settings.";
  }
  if (error?.code === 2) {
    return "GPS is unavailable right now. Turn on location services and try again, or tap the map.";
  }
  if (error?.code === 3) {
    return "Location timed out. Move near a window and try again, or tap the map.";
  }
  return "Could not get your location. Tap the map to drop a pin instead.";
}

export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(new Error(gpsErrorMessage()));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        reject(new Error(gpsErrorMessage(err)));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  });
}
