// Palette of backgrounds matching the Kawudulla MV Library system colors (Maroons, Deep Wines, Crimsons, Terracotta, and Dark Ambers)
export const SYSTEM_COVER_BACKGROUNDS = [
  'linear-gradient(135deg, #4A0202 0%, #7F0A0A 100%)', // Deep Wine
  'linear-gradient(135deg, #7F0A0A 0%, #9E0D0D 100%)', // Primary System Maroon
  'linear-gradient(135deg, #991B1B 0%, #B91C1C 100%)', // Rich Crimson
  'linear-gradient(135deg, #7C2D12 0%, #9A3412 100%)', // Warm Terracotta
  'linear-gradient(135deg, #78350F 0%, #B45309 100%)', // Dark Amber Gold
  'linear-gradient(135deg, #450A0A 0%, #701A75 100%)', // Burgundy Plum
];

/**
 * Returns a consistent, system-matching background gradient for a book without a cover image.
 */
export const getEmptyBookCoverBackground = (book) => {
  const str = book?.title || book?.bookId || book?._id || 'Kawudulla';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SYSTEM_COVER_BACKGROUNDS.length;
  return SYSTEM_COVER_BACKGROUNDS[index];
};
