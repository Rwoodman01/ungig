import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

let mapsBootstrapPromise = null;

/** Loads Maps JS API bootstrap; call `google.maps.importLibrary('places')` after this resolves. */
function loadMapsBootstrap() {
  if (!API_KEY) return Promise.resolve(null);
  if (mapsBootstrapPromise) return mapsBootstrapPromise;
  mapsBootstrapPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) {
      resolve();
      return;
    }
    const id = 'gifted-google-maps-js';
    if (document.getElementById(id)) {
      const wait = () => {
        if (window.google?.maps?.importLibrary) resolve();
        else setTimeout(wait, 50);
      };
      wait();
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&v=weekly&loading=async&libraries=places`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google Maps'));
    document.head.appendChild(s);
  });
  return mapsBootstrapPromise;
}

/**
 * @typedef {{ name: string, lat: number | null, lng: number | null }} LocationValue
 * @param {{ value: LocationValue, onChange: (v: LocationValue) => void, disabled?: boolean, id?: string }} props
 */
export default function LocationPlacesField({ value, onChange, disabled, id }) {
  const [input, setInput] = useState(value?.name ?? '');
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /** Maps/Places library ready for suggestions (input stays enabled regardless). */
  const [mapsReady, setMapsReady] = useState(!API_KEY);
  const wrapRef = useRef(null);
  const placesLibRef = useRef(null);
  const sessionTokenRef = useRef(null);

  useEffect(() => {
    setInput(value?.name ?? '');
  }, [value?.name, value?.lat, value?.lng]);

  useEffect(() => {
    let cancelled = false;
    if (!API_KEY) {
      setMapsReady(true);
      return undefined;
    }
    (async () => {
      try {
        await loadMapsBootstrap();
        if (cancelled || !window.google?.maps?.importLibrary) return;
        const places = await google.maps.importLibrary('places');
        if (cancelled) return;
        placesLibRef.current = places;
        setMapsReady(true);
      } catch {
        if (!cancelled) setMapsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  const readLatLng = (loc) => {
    if (!loc) return { lat: null, lng: null };
    const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
    const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
    return {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  };

  const runPredictions = useCallback(async (q) => {
    const lib = placesLibRef.current;
    if (!lib?.AutocompleteSuggestion || !q.trim()) {
      setPredictions([]);
      return;
    }
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new lib.AutocompleteSessionToken();
    }
    setLoading(true);
    try {
      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: q.trim(),
        sessionToken: sessionTokenRef.current,
      });
      const list = (suggestions ?? []).filter((s) => s.placePrediction);
      setPredictions(list);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const pickPrediction = useCallback(
    async (suggestion) => {
      const pp = suggestion.placePrediction;
      if (!pp) return;
      setOpen(false);
      setLoading(true);
      try {
        const place = pp.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });
        const { lat, lng } = readLatLng(place.location);
        const display =
          typeof place.displayName === 'string'
            ? place.displayName
            : (place.displayName?.text ?? '');
        const name = (place.formattedAddress ?? display) || pp.text.toString();
        setInput(name);
        onChange({ name, lat, lng });
      } catch {
        onChange({
          name: pp.text.toString(),
          lat: null,
          lng: null,
        });
      } finally {
        setLoading(false);
        sessionTokenRef.current = null;
      }
    },
    [onChange],
  );

  const onInputChange = (e) => {
    const q = e.target.value;
    setInput(q);
    onChange({ name: q, lat: null, lng: null });
    setOpen(true);
    runPredictions(q);
  };

  return (
    <div
      ref={wrapRef}
      className="relative z-10 isolate pointer-events-auto"
    >
      <label htmlFor={id} className="text-sm font-medium text-ink-secondary mb-1 block">
        Location
      </label>
      {API_KEY && !mapsReady ? (
        <p className="text-[11px] text-ink-muted mb-1">Loading address search…</p>
      ) : null}
      <input
        id={id}
        className="input relative z-10 w-full"
        value={input}
        onChange={onInputChange}
        onFocus={() => {
          setOpen(true);
          if (predictions.length === 0) runPredictions(input);
        }}
        disabled={disabled}
        placeholder={API_KEY ? 'City or neighborhood' : 'City or neighborhood (add Maps API key for suggestions)'}
        autoComplete="off"
      />
      {!API_KEY ? (
        <p className="text-[11px] text-ink-muted mt-1">
          Set <code className="text-ink-secondary">VITE_GOOGLE_MAPS_API_KEY</code> for Google Places suggestions.
        </p>
      ) : null}
      {open && predictions.length > 0 ? (
        <ul
          className={clsx(
            'absolute z-[100] mt-1 w-full rounded-xl border border-border bg-surface shadow-card max-h-52 overflow-y-auto',
          )}
        >
          {predictions.map((suggestion) => {
            const pp = suggestion.placePrediction;
            const key = pp.placeId ?? String(pp.text);
            return (
              <li key={key}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-cream"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickPrediction(suggestion)}
                >
                  {pp.text.toString()}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {loading ? <p className="text-[11px] text-ink-muted mt-1">Loading…</p> : null}
    </div>
  );
}
