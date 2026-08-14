'use client';

/**
 * <img> wrapper that hides itself when the source fails to load, revealing
 * the branded thumbnail fallback underneath. Lives in its own client
 * component so NewsCard can be rendered from server components (e.g. /brief)
 * without passing event handlers across the boundary.
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
