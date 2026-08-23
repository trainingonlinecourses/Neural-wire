'use client';

/**
 * <img> wrapper that falls back gracefully. When the source fails:
 * 1. First tries to extract a dominant color from the alt text hash
 * 2. Hides the img and reveals a unique gradient behind it
 *
 * Each card already has a branded gradient in .thumb — the SafeImage just
 * overlays the actual photo when available. When the photo fails, the
 * branded gradient underneath is revealed automatically.
 */
export function SafeImage({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <img
      loading="lazy"
      src={src}
      alt={alt}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

/**
 * Generate a deterministic gradient from a string (title or id).
 * Used for story cards that have no thumbnail — gives each one a
 * unique look instead of all showing the same fallback.
 */
export function titleGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40 + Math.abs((hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 60%, 18%), hsl(${h2}, 50%, 10%))`;
}
