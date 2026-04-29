/** Max distance slider options (miles). Last entry is "Anywhere" → stored as null. */
export const MAX_DISTANCE_MILES_OPTIONS = Object.freeze([
  { miles: 5, label: '5 miles' },
  { miles: 10, label: '10 miles' },
  { miles: 25, label: '25 miles' },
  { miles: 50, label: '50 miles' },
  { miles: 100, label: '100 miles' },
  { miles: null, label: 'Anywhere' },
]);

export const DEFAULT_MAX_DISTANCE_MILES = 25;
