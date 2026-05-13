// ─── Location Service ──────────────────────────────────────────────────────────
// Attempts real Google Maps API, auto-falls back to demo mode if unavailable.
// Persists selected location in localStorage across page refreshes.

const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlaceSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  fullAddress: string;
}

// ─── Demo Lagos Locations ─────────────────────────────────────────────────────

export const DEMO_LAGOS_LOCATIONS: PlaceSuggestion[] = [
  { id: 'd1',  mainText: 'Lekki Phase 1',        secondaryText: 'Lekki, Lagos State',                   fullAddress: '12 Admiralty Way, Lekki Phase 1, Lagos' },
  { id: 'd2',  mainText: 'Victoria Island',       secondaryText: 'Lagos Island, Lagos State',             fullAddress: '5 Adeola Odeku Street, Victoria Island, Lagos' },
  { id: 'd3',  mainText: 'Ikoyi',                 secondaryText: 'Lagos Island, Lagos State',             fullAddress: '18 Bourdillon Road, Ikoyi, Lagos' },
  { id: 'd4',  mainText: 'Ikeja',                 secondaryText: 'Ikeja, Lagos State',                    fullAddress: '7 Allen Avenue, Ikeja, Lagos' },
  { id: 'd5',  mainText: 'Yaba',                  secondaryText: 'Mainland, Lagos State',                 fullAddress: '23 Herbert Macaulay Way, Yaba, Lagos' },
  { id: 'd6',  mainText: 'Surulere',              secondaryText: 'Mainland, Lagos State',                 fullAddress: '45 Bode Thomas Street, Surulere, Lagos' },
  { id: 'd7',  mainText: 'Ajah',                  secondaryText: 'Lekki, Lagos State',                    fullAddress: '8 Lagos-Epe Expressway, Ajah, Lagos' },
  { id: 'd8',  mainText: 'Oniru',                 secondaryText: 'Victoria Island Extension, Lagos State', fullAddress: '15 Oniru Estate, Victoria Island Extension, Lagos' },
  { id: 'd9',  mainText: 'Marina',                secondaryText: 'Lagos Island, Lagos State',             fullAddress: '30 Marina Street, Lagos Island, Lagos' },
  { id: 'd10', mainText: 'Apapa',                 secondaryText: 'Apapa, Lagos State',                    fullAddress: '12 Creek Road, Apapa, Lagos' },
  { id: 'd11', mainText: 'Gbagada',               secondaryText: 'Mainland, Lagos State',                 fullAddress: '7 Mobolaji Bank Anthony Way, Gbagada, Lagos' },
  { id: 'd12', mainText: 'Magodo',                secondaryText: 'Kosofe, Lagos State',                   fullAddress: '42 Magodo Estate Phase 2, Lagos' },
  { id: 'd13', mainText: 'Ojodu Berger',          secondaryText: 'Ojodu, Lagos State',                    fullAddress: '5 Redemption Crescent, Ojodu Berger, Lagos' },
  { id: 'd14', mainText: 'Isolo',                 secondaryText: 'Oshodi-Isolo, Lagos State',             fullAddress: '17 Ago Palace Way, Isolo, Lagos' },
  { id: 'd15', mainText: 'Festac Town',           secondaryText: 'Amuwo-Odofin, Lagos State',             fullAddress: '22 Civic Centre Road, Festac Town, Lagos' },
  { id: 'd16', mainText: 'Ikorodu',               secondaryText: 'Ikorodu, Lagos State',                  fullAddress: '8 Odogunyan Road, Ikorodu, Lagos' },
  { id: 'd17', mainText: 'Ogudu',                 secondaryText: 'Kosofe, Lagos State',                   fullAddress: '14 Ogudu Road, Lagos' },
  { id: 'd18', mainText: 'Ketu',                  secondaryText: 'Kosofe, Lagos State',                   fullAddress: '9 Mile 12 Road, Ketu, Lagos' },
  { id: 'd19', mainText: 'Maryland',              secondaryText: 'Ikeja, Lagos State',                    fullAddress: '3 Ikorodu Road, Maryland, Lagos' },
  { id: 'd20', mainText: 'Ojota',                 secondaryText: 'Kosofe, Lagos State',                   fullAddress: '11 Ojota Road, Ojota, Lagos' },
  { id: 'd21', mainText: 'Oshodi',                secondaryText: 'Oshodi-Isolo, Lagos State',             fullAddress: '5 Oshodi Interchange, Lagos' },
  { id: 'd22', mainText: 'Agege',                 secondaryText: 'Agege, Lagos State',                    fullAddress: '20 Agege Motor Road, Agege, Lagos' },
  { id: 'd23', mainText: 'Egbeda',                secondaryText: 'Alimosho, Lagos State',                 fullAddress: '15 Shasha Road, Egbeda, Lagos' },
  { id: 'd24', mainText: 'Badagry',               secondaryText: 'Badagry, Lagos State',                  fullAddress: '7 Badagry Expressway, Badagry, Lagos' },
  { id: 'd25', mainText: 'Sangotedo',             secondaryText: 'Ajah, Lagos State',                     fullAddress: '33 Monastery Road, Sangotedo, Lagos' },
  { id: 'd26', mainText: 'Chevron Drive',         secondaryText: 'Lekki, Lagos State',                    fullAddress: 'Chevron Drive, Lekki, Lagos' },
  { id: 'd27', mainText: 'Abraham Adesanya',      secondaryText: 'Ajah, Lagos State',                     fullAddress: 'Abraham Adesanya Estate, Ajah, Lagos' },
  { id: 'd28', mainText: 'Ilasan',                secondaryText: 'Lekki Phase 2, Lagos State',            fullAddress: 'Ilasan, Lekki Phase 2, Lagos' },
  { id: 'd29', mainText: 'Osapa London',          secondaryText: 'Lekki, Lagos State',                    fullAddress: 'Osapa London Estate, Lekki, Lagos' },
  { id: 'd30', mainText: 'Agungi',                secondaryText: 'Lekki, Lagos State',                    fullAddress: 'Agungi Estate, Lekki, Lagos' },
];

// ─── Google Maps Loader ────────────────────────────────────────────────────────

type MapsState = 'idle' | 'loading' | 'loaded' | 'failed';

let mapsState: MapsState = 'idle';
let mapsCallbacks: Array<(loaded: boolean) => void> = [];

declare global {
  interface Window {
    __foodChainMapsReady?: () => void;
    google?: any;
  }
}

export function loadGoogleMaps(): Promise<boolean> {
  if (!GOOGLE_MAPS_KEY) return Promise.resolve(false);
  if (mapsState === 'loaded') return Promise.resolve(true);
  if (mapsState === 'failed') return Promise.resolve(false);

  if (mapsState === 'loading') {
    return new Promise(resolve => mapsCallbacks.push(resolve));
  }

  mapsState = 'loading';

  return new Promise((resolve) => {
    mapsCallbacks.push(resolve);

    const notify = (success: boolean) => {
      mapsState = success ? 'loaded' : 'failed';
      const cbs = mapsCallbacks;
      mapsCallbacks = [];
      cbs.forEach(cb => cb(success));
    };

    // Fallback timeout — if Google Maps doesn't load in 8 s, use demo mode
    const timeout = setTimeout(() => {
      if (mapsState === 'loading') notify(false);
    }, 8000);

    const callbackName = '__foodChainMapsReady';
    window[callbackName] = () => {
      clearTimeout(timeout);
      notify(true);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeout);
      if (mapsState === 'loading') notify(false);
    };
    document.head.appendChild(script);
  });
}

/** Returns true only when the JS SDK is fully loaded and places are accessible. */
export function isGoogleMapsAvailable(): boolean {
  return mapsState === 'loaded' && !!window.google?.maps?.places;
}

// ─── Demo suggestions filter ───────────────────────────────────────────────────

function getDemoSuggestions(query: string): PlaceSuggestion[] {
  const q = query.toLowerCase().trim();
  if (!q) return DEMO_LAGOS_LOCATIONS.slice(0, 6);
  return DEMO_LAGOS_LOCATIONS.filter(
    loc =>
      loc.mainText.toLowerCase().includes(q) ||
      loc.secondaryText.toLowerCase().includes(q) ||
      loc.fullAddress.toLowerCase().includes(q)
  ).slice(0, 6);
}

// ─── Search (real → demo fallback) ────────────────────────────────────────────

/**
 * Returns up to 6 address suggestions for the given query.
 * Tries Google Maps Places API first; falls back to demo Lagos locations.
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query.trim() || query.length < 2) return [];

  const mapsLoaded = await loadGoogleMaps();

  if (mapsLoaded && window.google?.maps?.places) {
    return new Promise(resolve => {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'ng' },
            types: ['geocode'],
          },
          (predictions: any[] | null, status: string) => {
            if (status === 'OK' && predictions?.length) {
              resolve(
                predictions.slice(0, 6).map(p => ({
                  id: p.place_id as string,
                  mainText: (p.structured_formatting?.main_text as string) || p.description,
                  secondaryText: (p.structured_formatting?.secondary_text as string) || '',
                  fullAddress: p.description as string,
                }))
              );
            } else {
              resolve(getDemoSuggestions(query));
            }
          }
        );
      } catch {
        resolve(getDemoSuggestions(query));
      }
    });
  }

  return getDemoSuggestions(query);
}

// ─── Reverse Geocoding (real → demo fallback) ──────────────────────────────────

/**
 * Converts GPS coordinates to a human-readable address.
 * Falls back to a generic Lagos string if Maps is unavailable.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const mapsLoaded = await loadGoogleMaps();

  if (!mapsLoaded || !window.google?.maps) {
    throw new Error('Google Maps not available');
  }

  return new Promise((resolve, reject) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any[] | null, status: string) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].formatted_address as string);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Road Distance Matrix ──────────────────────────────────────────────────────

export interface DistanceDestination {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface DistanceResult {
  km: number;
  text: string;
}

/**
 * Computes driving distances from the user's position to each destination.
 * Uses Google Maps Distance Matrix API when available; returns an empty Map
 * if the API is unavailable (caller should fall back to Haversine).
 */
export async function computeRoadDistancesKm(
  userLat: number,
  userLng: number,
  destinations: DistanceDestination[]
): Promise<Map<string, DistanceResult>> {
  const result = new Map<string, DistanceResult>();
  if (!destinations.length) return result;

  const mapsLoaded = await loadGoogleMaps();
  if (!mapsLoaded || !window.google?.maps) return result;

  return new Promise((resolve) => {
    try {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [{ lat: userLat, lng: userLng }],
          destinations: destinations.map(d => d.address),
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response: any, status: string) => {
          if (status !== 'OK' || !response?.rows?.[0]?.elements) {
            resolve(result);
            return;
          }
          const elements: any[] = response.rows[0].elements;
          elements.forEach((el: any, i: number) => {
            if (el.status === 'OK') {
              const km = el.distance.value / 1000;
              result.set(destinations[i].id, { km, text: `${km.toFixed(1)} km` });
            }
          });
          resolve(result);
        }
      );
    } catch {
      resolve(result);
    }
  });
}

// ─── Forward Geocoding ────────────────────────────────────────────────────────

/**
 * Converts an address string to lat/lng.
 * Prefers the Google Maps Geocoder SDK (already loaded by LocationPicker).
 * Falls back to the REST API if the SDK isn't available.
 */
export async function geocodeAddressText(address: string): Promise<{ lat: number; lng: number } | null> {
  const mapsLoaded = await loadGoogleMaps();

  if (mapsLoaded && window.google?.maps) {
    return new Promise((resolve) => {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results: any[], status: string) => {
          if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            resolve({ lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat, lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng });
          } else {
            resolve(null);
          }
        });
      } catch {
        resolve(null);
      }
    });
  }

  if (!GOOGLE_MAPS_KEY) return null;
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`);
    const data = await res.json();
    if (data.status === 'OK' && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch {}
  return null;
}

// ─── Persistence ───────────────────────────────────────────────────────────────

const LOCATION_KEY = 'foodchain_delivery_location';

export function saveDeliveryLocation(location: string): void {
  if (location.trim()) localStorage.setItem(LOCATION_KEY, location.trim());
}

export function getSavedDeliveryLocation(): string {
  return localStorage.getItem(LOCATION_KEY) || '';
}
