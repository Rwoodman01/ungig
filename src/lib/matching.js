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
  const filter = normalize(locationFilter || userDoc?.location);
  const local = filter && normalize(member.location).includes(filter);
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

export function sortDeckMembers({ members = [], userDoc, swipes = [], locationFilter = '' }) {
  const swipedMap = Object.fromEntries(swipes.map((s) => [s.targetUid ?? s.id, s]));
  const enriched = members
    .filter((m) => m.id !== userDoc?.uid)
    .map((member) => ({
      ...member,
      deckMeta: scoreMemberForDeck({ member, userDoc, swipedMap, locationFilter }),
    }));

  const primary = enriched
    .filter((m) => !m.deckMeta.alreadySwiped)
    .sort((a, b) => b.deckMeta.score - a.deckMeta.score);
  const recycled = enriched
    .filter((m) => m.deckMeta.alreadySwiped)
    .sort((a, b) => b.deckMeta.score - a.deckMeta.score);

  return { primary, recycled };
}
