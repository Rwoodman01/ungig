import {
  formatDistanceMilesLabel,
  getEffectiveMaxDistanceMiles,
  getLocationDisplayName,
  getUserLatLng,
  haversineMiles,
} from './geo.js';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeTags(values = []) {
  return values.map(normalize).filter(Boolean);
}

export function hasOverlap(a = [], b = []) {
  const left = normalizeTags(a);
  const right = new Set(normalizeTags(b));
  return left.some((x) => right.has(x));
}

export function getMemberCover(member) {
  return member?.portfolioPhotos?.[0]?.url
    ?? member?.proofPhotos?.[0]
    ?? member?.photoURL
    ?? '/giff/face.png';
}

export function getFitReason({ member, userDoc }) {
  const theirNeedsMatchMyOffers = hasOverlap(member.servicesNeeded, userDoc?.talentsOffered);
  const theirOffersMatchMyNeeds = hasOverlap(member.talentsOffered, userDoc?.servicesNeeded);
  if (theirNeedsMatchMyOffers && theirOffersMatchMyNeeds) return 'You both have what the other needs.';
  if (theirNeedsMatchMyOffers) return `${member.displayName ?? 'They'} may need what you offer.`;
  if (theirOffersMatchMyNeeds) return `${member.displayName ?? 'They'} offers something you need.`;
  return 'A new Gifted member to discover.';
}

export function scoreMemberForDeck({ member, userDoc, swipedMap = {}, locationFilter = '' }) {
  const theirNeedsMatchMyOffers = hasOverlap(member.servicesNeeded, userDoc?.talentsOffered);
  const theirOffersMatchMyNeeds = hasOverlap(member.talentsOffered, userDoc?.servicesNeeded);
  const mutual = theirNeedsMatchMyOffers && theirOffersMatchMyNeeds;
  const oneWay = theirNeedsMatchMyOffers || theirOffersMatchMyNeeds;
  const hasPortfolio = (member.portfolioPhotos?.length ?? 0) > 0 || (member.proofPhotos?.length ?? 0) > 0;
  const hasTrust = (member.tradeCount ?? 0) > 0 || (member.badges?.length ?? 0) > 0;
  const filter = normalize(locationFilter || getLocationDisplayName(userDoc));
  const memberLocStr = getLocationDisplayName(member);
  const local = filter && normalize(memberLocStr).includes(filter);
  const alreadySwiped = Boolean(swipedMap[member.id]);

  let score = 0;
  if (mutual) score += 1000;
  else if (oneWay) score += 600;
  if (local) score += 250;
  if (hasPortfolio) score += 150;
  if (hasTrust) score += 100;
  score += Math.min(member.tradeCount ?? 0, 25);
  if (!hasPortfolio && !hasTrust) score -= 100;
  if (alreadySwiped) score -= 10000;

  return {
    score,
    mutual,
    oneWay,
    local,
    hasPortfolio,
    hasTrust,
    alreadySwiped,
    fitReason: getFitReason({ member, userDoc }),
  };
}

function passesMaxDistance({ distanceMiles, maxMi, myCoords, theirCoords }) {
  if (maxMi === Infinity) return true;
  if (!myCoords) return true;
  if (!theirCoords || distanceMiles == null) return false;
  return distanceMiles <= maxMi;
}

function sortByGiftedThenDeck(a, b) {
  const ga = a.giftedScore ?? 50;
  const gb = b.giftedScore ?? 50;
  if (gb !== ga) return gb - ga;
  return b.deckMeta.score - a.deckMeta.score;
}

export function sortDeckMembers({ members = [], userDoc, swipes = [], locationFilter = '' }) {
  const swipedMap = Object.fromEntries(swipes.map((s) => [s.targetUid ?? s.id, s]));
  const myCoords = getUserLatLng(userDoc);
  const maxMi = getEffectiveMaxDistanceMiles(userDoc);

  const enriched = members
    .filter((m) => m.id !== userDoc?.uid)
    .map((member) => {
      const theirCoords = getUserLatLng(member);
      let distanceMiles = null;
      if (myCoords && theirCoords) {
        distanceMiles = haversineMiles(
          myCoords.lat,
          myCoords.lng,
          theirCoords.lat,
          theirCoords.lng,
        );
      }
      return {
        ...member,
        distanceMiles,
        distanceLabel: formatDistanceMilesLabel(distanceMiles),
        deckMeta: scoreMemberForDeck({ member, userDoc, swipedMap, locationFilter }),
      };
    })
    .filter((m) =>
      passesMaxDistance({
        distanceMiles: m.distanceMiles,
        maxMi,
        myCoords,
        theirCoords: getUserLatLng(m),
      }));

  const primary = enriched
    .filter((m) => !m.deckMeta.alreadySwiped)
    .sort(sortByGiftedThenDeck);
  const recycled = enriched
    .filter((m) => m.deckMeta.alreadySwiped)
    .sort(sortByGiftedThenDeck);

  return { primary, recycled };
}

/** Browse list: same geo filter + Gifted Score sort (includes already-swiped members). */
export function filterSortBrowseListMembers(members, userDoc, { locationSubstring = '' } = {}) {
  const myCoords = getUserLatLng(userDoc);
  const maxMi = getEffectiveMaxDistanceMiles(userDoc);
  const locSub = normalize(locationSubstring);

  const enriched = members
    .filter((m) => m.id !== userDoc?.uid)
    .map((member) => {
      const theirCoords = getUserLatLng(member);
      let distanceMiles = null;
      if (myCoords && theirCoords) {
        distanceMiles = haversineMiles(
          myCoords.lat,
          myCoords.lng,
          theirCoords.lat,
          theirCoords.lng,
        );
      }
      return {
        ...member,
        distanceMiles,
        distanceLabel: formatDistanceMilesLabel(distanceMiles),
        deckMeta: scoreMemberForDeck({ member, userDoc, swipedMap: {}, locationFilter: '' }),
      };
    })
    .filter((m) =>
      passesMaxDistance({
        distanceMiles: m.distanceMiles,
        maxMi,
        myCoords,
        theirCoords: getUserLatLng(m),
      }))
    .filter((m) => {
      if (!locSub) return true;
      return normalize(getLocationDisplayName(m)).includes(locSub);
    });

  return [...enriched].sort(sortByGiftedThenDeck);
}
