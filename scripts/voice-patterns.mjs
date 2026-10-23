// House patterns: the literal "Never write" and scarcity items from the Voice section of CLAUDE.md.
// Same shape as the vendored ones: { id, name, description, find(text) -> [{ start, end }] }.
// Add a pattern here when a board member or reviewer spots a repeat offender.

const finder = (re) => (text) =>
  [...text.matchAll(re)].map((m) => ({ start: m.index, end: m.index + m[0].length }));

export const patterns = [
  {
    id: 'house-hype',
    name: 'House: hype filler',
    description: 'Hype filler the voice guide bans.',
    find: finder(/\b(?:unforgettable|fun-filled|exciting opportunity|join us for a day of|something for everyone)\b/gi),
  },
  {
    id: 'house-scarcity',
    name: 'House: scarcity',
    description: 'Pressure and scarcity wording. Every bit counts.',
    find: finder(/\b(?:before we sell out|don['’]t miss out|limited spots|selling fast)\b/gi),
  },
  {
    id: 'house-countdown',
    name: 'House: countdown wording',
    description: 'Countdown clocks and urgency.',
    find: finder(/\b(?:only\s+\S+\s+days?\s+left|hurry)\b/gi),
  },
  {
    id: 'house-em-dash',
    name: 'House: em dash',
    description: 'Check whether the dash is doing a comma\'s job.',
    find: finder(/—/g),
  },
];
