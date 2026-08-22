'use client';

/**
 * StoryKeyboardNav — adds j/k keyboard shortcuts for navigating between
 * story cards in the Newsroom. Press j to go down, k to go up, Enter/o
 * to open the selected story, x to dismiss, and ? to show help.
 *
 * Visual: selected card gets a subtle highlight ring.
 */

import { useCallback, useEffect, useRef } from 'react';

interface KeyboardNavOptions {
  /** Selector for the story card elements */
  cardSelector?: string;
  /** Selector for the grid container */
  gridSelector?: string;
  /** Enable/disable the keyboard nav */
  enabled?: boolean;
}

const DEFAULT_CARD_SELECTOR = '.grid > .card';
const SCROLL_OFFSET = 120; // px above viewport top when scrolling to card

export function useStoryKeyboardNav({
  cardSelector = DEFAULT_CARD_SELECTOR,
  gridSelector = '.grid',
  enabled = true,
}: KeyboardNavOptions = {}) {
  const activeIdx = useRef(-1);

  const getCards = useCallback(() => {
    return Array.from(document.querySelectorAll(cardSelector)) as HTMLElement[];
  }, [cardSelector]);

  const highlightCard = useCallback((idx: number) => {
    const cards = getCards();
    // Remove previous highlight
    cards.forEach((c) => c.classList.remove('card-active'));
    if (idx >= 0 && idx < cards.length) {
      cards[idx].classList.add('card-active');
      cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [getCards]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    // Don't intercept when typing in an input/textarea/select
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    // Don't intercept when a modal/overlay is open
    if (document.querySelector('.search-overlay') || document.querySelector('.palette-overlay')) return;

    const cards = getCards();
    if (!cards.length) return;

    switch (e.key) {
      case 'j': {
        // Next story
        e.preventDefault();
        activeIdx.current = Math.min(activeIdx.current + 1, cards.length - 1);
        highlightCard(activeIdx.current);
        break;
      }
      case 'k': {
        // Previous story
        e.preventDefault();
        activeIdx.current = Math.max(activeIdx.current - 1, 0);
        highlightCard(activeIdx.current);
        break;
      }
      case 'o':
      case 'Enter': {
        // Open selected story
        if (activeIdx.current >= 0 && activeIdx.current < cards.length) {
          const link = cards[activeIdx.current].querySelector('a[href]') as HTMLAnchorElement;
          if (link && e.key === 'o') {
            e.preventDefault();
            window.open(link.href, '_blank');
          }
        }
        break;
      }
      case 'x': {
        // Dismiss selected story
        if (activeIdx.current >= 0 && activeIdx.current < cards.length) {
          const xBtn = cards[activeIdx.current].querySelector('.card-x') as HTMLButtonElement;
          if (xBtn) {
            e.preventDefault();
            xBtn.click();
            activeIdx.current = Math.min(activeIdx.current, getCards().length - 1);
          }
        }
        break;
      }
      case 'Escape': {
        // Clear selection
        activeIdx.current = -1;
        cards.forEach((c) => c.classList.remove('card-active'));
        break;
      }
    }
  }, [getCards, highlightCard]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [enabled, handleKey]);
}
