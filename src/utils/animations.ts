/**
 * Animation utilities for mesocycle plan fields
 * Handles pulse and highlight animations for AI-driven changes
 */

/**
 * Pulse animation for fields changed by AI
 * Brief scale animation to draw attention
 */
export const pulseAnimation = {
  duration: 600, // ms
  keyframes: [
    { transform: 'scale(1)', offset: 0 },
    { transform: 'scale(1.05)', offset: 0.5 },
    { transform: 'scale(1)', offset: 1 }
  ],
  easing: 'ease-in-out'
};

/**
 * Highlight animation duration
 * Fields remain highlighted for 15 seconds after AI change
 */
export const HIGHLIGHT_DURATION_MS = 15000;

/**
 * CSS classes for ownership states
 */
export const ownershipClasses = {
  system: 'field-system bg-blue-50 border-blue-200',
  athlete: 'field-athlete bg-green-50 border-green-200',
  locked: 'field-locked bg-gray-100 border-gray-300'
};

/**
 * CSS classes for field highlights
 */
export const highlightClasses = 'field-highlight ring-2 ring-yellow-300 ring-opacity-50 bg-yellow-50';

/**
 * Get ownership badge styling
 */
export function getOwnershipBadge(ownership: 'system' | 'athlete' | 'locked'): {
  text: string;
  className: string;
} {
  switch (ownership) {
    case 'system':
      return {
        text: 'AI',
        className: 'bg-blue-100 text-blue-700'
      };
    case 'athlete':
      return {
        text: 'You',
        className: 'bg-green-100 text-green-700'
      };
    case 'locked':
      return {
        text: 'Locked',
        className: 'bg-gray-200 text-gray-700'
      };
  }
}

/**
 * Apply pulse animation to an element
 */
export function applyPulseAnimation(element: HTMLElement): void {
  if (!element) return;

  element.animate(pulseAnimation.keyframes, {
    duration: pulseAnimation.duration,
    easing: pulseAnimation.easing
  });
}

/**
 * Check if a highlight should still be active
 */
export function isHighlightActive(highlightUntil?: number): boolean {
  if (!highlightUntil) return false;
  return Date.now() < highlightUntil;
}

/**
 * Calculate remaining highlight time in milliseconds
 */
export function getRemainingHighlightTime(highlightUntil?: number): number {
  if (!highlightUntil) return 0;
  const remaining = highlightUntil - Date.now();
  return Math.max(0, remaining);
}
