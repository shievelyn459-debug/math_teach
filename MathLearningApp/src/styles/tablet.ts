/**
 * Tablet Design System
 *
 * Responsive utilities and constants for tablet-optimized layouts.
 * Follows Material Design and Human Interface Guidelines.
 */

// Tablet breakpoints based on screen width (dp)
export enum TABLET_BREAKPOINTS {
  SMALL_TABLET = 600,  // 7" tablets (iPad Mini, Galaxy Tab A)
  MEDIUM_TABLET = 900, // 9" tablets (iPad, iPad Air, Galaxy Tab S)
  LARGE_TABLET = 1024, // 11"+ tablets (iPad Pro)
}

// Tablet font sizes (sp)
export const TABLET_FONT_SIZES = {
  body: 16,      // Minimum 16sp for body text (WCAG AA)
  heading: 20,   // Minimum 20sp for headings
  caption: 14,   // Minimum 14sp for captions
  title: 24,     // Large tablet titles
};

// Tablet spacing (dp)
export const TABLET_SPACING = {
  padding: 16,        // Minimum 16dp padding
  section: 20,        // Minimum 20dp between sections
  touchTargetGap: 8,  // 8dp between touch targets
};

// Touch target sizes (dp)
export const TOUCH_TARGETS = {
  min: 48,       // 48x48dp minimum (4.3mm physical size)
  recommended: 56, // 56x56dp recommended for thumb-friendly interaction
};

/**
 * Calculate scaled font size based on screen width
 * @param baseSize - Base font size for phone (375dp width)
 * @param screenWidth - Current screen width in dp
 * @returns Scaled font size (max 1.3x scale factor)
 */
export const getFontSize = (baseSize: number, screenWidth: number): number => {
  const PHONE_WIDTH = 375;
  const MAX_SCALE = 1.3;
  const scaleFactor = Math.min(screenWidth / PHONE_WIDTH, MAX_SCALE);
  return Math.round(baseSize * scaleFactor);
};

/**
 * Calculate scaled spacing based on screen width
 * @param baseSpacing - Base spacing for phone (375dp width)
 * @param screenWidth - Current screen width in dp
 * @returns Scaled spacing (max 1.2x scale factor)
 */
export const getScaledSpacing = (baseSpacing: number, screenWidth: number): number => {
  const PHONE_WIDTH = 375;
  const MAX_SCALE = 1.2;
  const scaleFactor = Math.min(screenWidth / PHONE_WIDTH, MAX_SCALE);
  return Math.round(baseSpacing * scaleFactor);
};

/**
 * Get breakpoint category for screen width
 * @param screenWidth - Screen width in dp
 * @returns Breakpoint category: 'small', 'medium', or 'large'
 *
 * Breakpoints:
 * - small: < 600dp (phones)
 * - medium: 600-899dp (small-medium tablets)
 * - large: >= 900dp (large tablets)
 */
export const getBreakpoint = (
  screenWidth: number
): 'small' | 'medium' | 'large' => {
  if (screenWidth < 600) {
    return 'small';
  } else if (screenWidth < 900) {
    return 'medium';
  } else {
    return 'large';
  }
};

/**
 * Get responsive value based on breakpoint
 * @param values - Object with small/medium/large values
 * @param screenWidth - Screen width in dp
 * @returns Value for current breakpoint (falls back to small if not defined)
 */
export const getResponsiveValue = <T>(
  values: {small?: T; medium?: T; large?: T},
  screenWidth: number
): T | undefined => {
  const breakpoint = getBreakpoint(screenWidth);

  // Try exact match first
  if (values[breakpoint] !== undefined) {
    return values[breakpoint];
  }

  // Fallback: small → large (skip medium as it's optional)
  if (breakpoint === 'medium' && values.small !== undefined) {
    return values.small;
  }

  return undefined;
};

/**
 * Check if layout is in landscape orientation
 * @param width - Screen width
 * @param height - Screen height
 * @returns true if landscape, false if portrait
 */
export const isLandscape = (width: number, height: number): boolean => {
  return width > height;
};

/**
 * Calculate number of columns for grid layout
 * @param screenWidth - Screen width in dp
 * @param minItemWidth - Minimum item width in dp (default: 300)
 * @returns Number of columns (1-2)
 */
export const getNumColumns = (
  screenWidth: number,
  minItemWidth: number = 300
): number => {
  if (screenWidth >= minItemWidth * 2) {
    return 2;
  }
  return 1;
};
