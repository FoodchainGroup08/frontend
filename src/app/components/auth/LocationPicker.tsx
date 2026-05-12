import { useCallback, useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X, CheckCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  searchPlaces,
  reverseGeocode,
  isGoogleMapsAvailable,
  saveDeliveryLocation,
  type PlaceSuggestion,
} from '@/services/locationService';

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = 'e.g. Lekki Phase 1, Victoria Island…',
}: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // GPS detection
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [locationError, setLocationError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep internal query synced when value prop changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // ── GPS detection on mount ──────────────────────────────────────────────────
  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support current location detection.');
      setIsDemoMode(!isGoogleMapsAvailable());
      return;
    }

    setLocationError('');
    setIsDetecting(true);
    setShowBanner(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setDetectedAddress(address);
          setShowBanner(true);
        } catch {
          setLocationError('We could not read your current location. Please try again or enter it manually.');
        } finally {
          setIsDetecting(false);
          setIsDemoMode(!isGoogleMapsAvailable());
        }
      },
      (error) => {
        setIsDetecting(false);
        setIsDemoMode(!isGoogleMapsAvailable());
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. Allow location access, then try again.');
          return;
        }
        setLocationError('We could not detect your current location. Please try again or enter it manually.');
      },
      { timeout: 8000, maximumAge: 120_000 }
    );
  }, []);

  useEffect(() => {
    detectCurrentLocation();
  }, [detectCurrentLocation]);

  // ── Input change + debounced search ────────────────────────────────────────
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // ALWAYS update the parent component with the current value
    onChange(val);

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsFetchingSuggestions(true);
      try {
        const results = await searchPlaces(val);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsDemoMode(!isGoogleMapsAvailable());
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 280);
  };

  // ── Select a suggestion ─────────────────────────────────────────────────────
  const handleSelect = (suggestion: PlaceSuggestion) => {
    const addr = suggestion.fullAddress;
    setQuery(addr);
    onChange(addr);
    saveDeliveryLocation(addr);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ── Use detected GPS location ───────────────────────────────────────────────
  const handleUseDetected = () => {
    if (detectedAddress) {
      setQuery(detectedAddress);
      onChange(detectedAddress);
      saveDeliveryLocation(detectedAddress);
    }
    setShowBanner(false);
  };

  const handleEnterManually = () => {
    setShowBanner(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Clear input ─────────────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div className="space-y-2">
      {/* ── GPS / detected location banner ─────────────────────────────────── */}
      {(isDetecting || showBanner) && (
        <div
          className="p-3 rounded-lg border flex items-start gap-3"
          style={{
            borderColor: 'var(--foodchain-golden-amber)',
            backgroundColor: 'rgba(240, 165, 0, 0.06)',
          }}
        >
          {isDetecting ? (
            <>
              <Loader2
                className="w-4 h-4 mt-0.5 animate-spin flex-shrink-0"
                style={{ color: 'var(--foodchain-golden-amber)' }}
              />
              <p className="text-sm" style={{ color: 'var(--foodchain-espresso)' }}>
                Detecting your location…
              </p>
            </>
          ) : showBanner && detectedAddress ? (
            <>
              <Navigation
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: 'var(--foodchain-sage-green)' }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm mb-0.5"
                  style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}
                >
                  We detected your location
                </p>
                <p
                  className="text-sm mb-3 break-words"
                  style={{ color: 'var(--foodchain-espresso)', opacity: 0.75 }}
                >
                  {detectedAddress}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUseDetected}
                    className="h-7 text-xs px-3 gap-1"
                    style={{
                      backgroundColor: 'var(--foodchain-sage-green)',
                      color: 'var(--foodchain-white)',
                    }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Use this location
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleEnterManually}
                    className="h-7 text-xs px-3 border-[var(--foodchain-espresso)]/20"
                    style={{ color: 'var(--foodchain-espresso)' }}
                  >
                    Enter manually
                  </Button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnterManually}
                className="flex-shrink-0 hover:opacity-60 transition-opacity"
                style={{ color: 'var(--foodchain-espresso)', opacity: 0.35 }}
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* ── Address input ───────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative">
          <MapPin
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none"
            style={{ color: 'var(--foodchain-espresso)', opacity: 0.45 }}
          />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => {
              // Save to localStorage when user leaves the field
              if (query.trim()) {
                saveDeliveryLocation(query.trim());
              }
            }}
            placeholder={placeholder}
            autoComplete="off"
            className="pl-10 pr-10 border-[var(--foodchain-espresso)]/20"
            style={{ backgroundColor: 'var(--foodchain-white)' }}
          />
          {/* Spinner or clear button on right */}
          {isFetchingSuggestions ? (
            <Loader2
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin pointer-events-none"
              style={{ color: 'var(--foodchain-espresso)', opacity: 0.4 }}
            />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
              style={{ color: 'var(--foodchain-espresso)', opacity: 0.35 }}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* ── Suggestions dropdown ──────────────────────────────────────────── */}
        <Button
          type="button"
          variant="outline"
          onClick={detectCurrentLocation}
          disabled={isDetecting}
          className="mt-2 h-9 w-full gap-2 border-[var(--foodchain-espresso)]/20"
          style={{ color: 'var(--foodchain-espresso)' }}
        >
          {isDetecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {isDetecting ? 'Checking current location...' : 'Try current location again'}
        </Button>

        {locationError && !isDetecting && (
          <p
            className="mt-2 text-xs"
            style={{ color: 'var(--foodchain-rust-red)' }}
          >
            {locationError}
          </p>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--foodchain-white)',
              border: '1px solid rgba(59, 35, 20, 0.12)',
            }}
          >
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click
                  handleSelect(s);
                }}
                className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[var(--foodchain-warm-white)]"
                style={{
                  borderBottom:
                    i < suggestions.length - 1
                      ? '1px solid rgba(59, 35, 20, 0.06)'
                      : 'none',
                }}
              >
                <MapPin
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: 'var(--foodchain-golden-amber)' }}
                />
                <div className="min-w-0">
                  <p
                    className="text-sm truncate"
                    style={{ color: 'var(--foodchain-espresso)', fontWeight: 500 }}
                  >
                    {s.mainText}
                  </p>
                  {s.secondaryText && (
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--foodchain-espresso)', opacity: 0.55 }}
                    >
                      {s.secondaryText}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Demo mode notice ─────────────────────────────────────────────────── */}
      {isDemoMode && !isDetecting && (
        <p
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--foodchain-espresso)', opacity: 0.5 }}
        >
          <MapPin className="w-3 h-3" />
          Showing sample Lagos locations (demo mode — Google Maps not configured)
        </p>
      )}
    </div>
  );
}
