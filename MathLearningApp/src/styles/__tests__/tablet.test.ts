/**
 * Tablet design system tests
 * Tests for responsive utilities, breakpoints, font scaling, and touch targets
 */

import {
  TABLET_BREAKPOINTS,
  TABLET_FONT_SIZES,
  TABLET_SPACING,
  TOUCH_TARGETS,
  getFontSize,
  getScaledSpacing,
  getBreakpoint,
  getResponsiveValue,
} from '../tablet';

describe('TABLET_BREAKPOINTS', () => {
  it('should have SMALL_TABLET breakpoint at 600', () => {
    expect(TABLET_BREAKPOINTS.SMALL_TABLET).toBe(600);
  });

  it('should have MEDIUM_TABLET breakpoint at 900', () => {
    // Medium breakpoint at 900 for 9" tablets
    expect(TABLET_BREAKPOINTS.MEDIUM_TABLET).toBe(900);
  });

  it('should have LARGE_TABLET breakpoint at 1024', () => {
    expect(TABLET_BREAKPOINTS.LARGE_TABLET).toBe(1024);
  });
});

describe('TABLET_FONT_SIZES', () => {
  it('should have body font size minimum of 16sp', () => {
    expect(TABLET_FONT_SIZES.body).toBeGreaterThanOrEqual(16);
  });

  it('should have heading font size minimum of 20sp', () => {
    expect(TABLET_FONT_SIZES.heading).toBeGreaterThanOrEqual(20);
  });

  it('should have caption font size minimum of 14sp', () => {
    expect(TABLET_FONT_SIZES.caption).toBeGreaterThanOrEqual(14);
  });

  it('should have title font size for large tablets', () => {
    expect(TABLET_FONT_SIZES.title).toBeDefined();
    expect(TABLET_FONT_SIZES.title).toBeGreaterThan(TABLET_FONT_SIZES.heading);
  });
});

describe('TABLET_SPACING', () => {
  it('should have minimum padding of 16dp', () => {
    expect(TABLET_SPACING.padding).toBeGreaterThanOrEqual(16);
  });

  it('should have section spacing minimum of 20dp', () => {
    expect(TABLET_SPACING.section).toBeGreaterThanOrEqual(20);
  });

  it('should have touch target spacing defined', () => {
    expect(TABLET_SPACING.touchTargetGap).toBeDefined();
  });
});

describe('TOUCH_TARGETS', () => {
  it('should have minimum touch target size of 48dp', () => {
    expect(TOUCH_TARGETS.min).toBe(48);
  });

  it('should have recommended touch target size of 56dp', () => {
    expect(TOUCH_TARGETS.recommended).toBe(56);
  });
});

describe('getFontSize', () => {
  it('should scale font based on screen width', () => {
    // Phone width (375) → base size
    expect(getFontSize(16, 375)).toBe(16);

    // Tablet width (600) → scaled size
    expect(getFontSize(16, 600)).toBeGreaterThan(16);
    expect(getFontSize(16, 600)).toBeLessThanOrEqual(21); // max 1.3x scale
  });

  it('should cap scaling at 1.3x factor', () => {
    const baseSize = 16;
    const maxWidth = 375 * 1.3; // 487.5

    // At scale limit
    const scaled = getFontSize(baseSize, 500);
    expect(scaled).toBe(Math.round(baseSize * 1.3));

    // Beyond scale limit
    const beyondLimit = getFontSize(baseSize, 1024);
    expect(beyondLimit).toBe(Math.round(baseSize * 1.3));
  });

  it('should return integer font sizes', () => {
    const result = getFontSize(16, 450);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('getScaledSpacing', () => {
  it('should scale spacing based on screen width', () => {
    // Phone width (375) → base spacing
    expect(getScaledSpacing(16, 375)).toBe(16);

    // Tablet width (600) → scaled spacing
    expect(getScaledSpacing(16, 600)).toBeGreaterThan(16);
  });

  it('should cap spacing scaling at 1.2x factor', () => {
    const baseSpacing = 16;
    const maxWidth = 375 * 1.2; // 450

    // At scale limit
    const scaled = getScaledSpacing(baseSpacing, 500);
    expect(scaled).toBe(Math.round(baseSpacing * 1.2));
  });
});

describe('getBreakpoint', () => {
  it('should return small for width < 600', () => {
    expect(getBreakpoint(500)).toBe('small');
    expect(getBreakpoint(599)).toBe('small');
  });

  it('should return medium for width 600-899', () => {
    expect(getBreakpoint(600)).toBe('medium');
    expect(getBreakpoint(750)).toBe('medium');
    expect(getBreakpoint(899)).toBe('medium');
  });

  it('should return large for width >= 900', () => {
    expect(getBreakpoint(900)).toBe('large');
    expect(getBreakpoint(1024)).toBe('large');
  });
});

describe('getResponsiveValue', () => {
  it('should return value based on breakpoint', () => {
    const values = {
      small: 1,
      medium: 2,
      large: 3,
    };

    expect(getResponsiveValue(values, 500)).toBe(1);
    expect(getResponsiveValue(values, 700)).toBe(2);
    expect(getResponsiveValue(values, 1000)).toBe(3);
  });

  it('should work with partial value definitions', () => {
    const values = {
      small: 1,
      large: 3,
    };

    // Should fall back to small for medium
    expect(getResponsiveValue(values, 700)).toBe(1);
    expect(getResponsiveValue(values, 1000)).toBe(3);
  });
});
