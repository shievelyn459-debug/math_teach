/**
 * Tests for accessible color system
 */

import { Colors, ContrastRatios } from '../colors';

describe('Colors', () => {
  describe('Text Colors', () => {
    it('should have all required text colors defined', () => {
      expect(Colors.text.primary).toBeDefined();
      expect(Colors.text.secondary).toBeDefined();
      expect(Colors.text.tertiary).toBeDefined();
      expect(Colors.text.disabled).toBeDefined();
      expect(Colors.text.hint).toBeDefined();
      expect(Colors.text.inverse).toBeDefined();
    });

    it('should have high contrast for primary text', () => {
      // Primary text (#212121) on white should have > 4.5:1 contrast
      const contrast = calculateContrastRatio(Colors.text.primary, Colors.white);
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });

    it('should have high contrast for secondary text', () => {
      const contrast = calculateContrastRatio(Colors.text.secondary, Colors.white);
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });

    it('should have high contrast for tertiary text', () => {
      const contrast = calculateContrastRatio(Colors.text.tertiary, Colors.white);
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });

    it('should have sufficient contrast for hint text', () => {
      const contrast = calculateContrastRatio(Colors.text.hint, Colors.white);
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });
  });

  describe('Semantic Colors', () => {
    it('should have high contrast for success text on success background', () => {
      const contrast = calculateContrastRatio(
        Colors.success.onDefault,
        Colors.success.default
      );
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });

    it('should have high contrast for error text on error background', () => {
      const contrast = calculateContrastRatio(
        Colors.error.onDefault,
        Colors.error.default
      );
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });

    it('should have high contrast for warning text on warning background', () => {
      const contrast = calculateContrastRatio(
        Colors.warning.onDefault,
        Colors.warning.default
      );
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });

    it('should have high contrast for info text on info background', () => {
      const contrast = calculateContrastRatio(
        Colors.info.onDefault,
        Colors.info.default
      );
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });
  });

  describe('Primary Color', () => {
    it('should have sufficient contrast for white text on primary', () => {
      const contrast = calculateContrastRatio(
        Colors.primaryOnPrimary,
        Colors.primary
      );
      expect(contrast).toBeGreaterThanOrEqual(ContrastRatios.AA_NORMAL);
    });
  });

  describe('Utility Functions', () => {
    describe('getTextColor', () => {
      it('should return dark text for light backgrounds', () => {
        expect(Colors.getTextColor('#ffffff')).toBe(Colors.text.primary);
        expect(Colors.getTextColor('#f5f5f5')).toBe(Colors.text.primary);
      });

      it('should return white text for dark backgrounds', () => {
        expect(Colors.getTextColor('#000000')).toBe(Colors.text.inverse);
        expect(Colors.getTextColor('#212121')).toBe(Colors.text.inverse);
      });
    });

    describe('withOpacity', () => {
      it('should add opacity to hex color', () => {
        const result = Colors.withOpacity('#2196f3', 0.5);
        expect(result).toBe('rgba(33, 150, 243, 0.5)');
      });

      it('should handle full opacity', () => {
        const result = Colors.withOpacity('#ff0000', 1);
        expect(result).toBe('rgba(255, 0, 0, 1)');
      });

      it('should handle zero opacity', () => {
        const result = Colors.withOpacity('#00ff00', 0);
        expect(result).toBe('rgba(0, 255, 0, 0)');
      });
    });
  });
});

/**
 * Calculate relative luminance of a color
 * @param hex - Hex color string (with or without #)
 * @returns Relative luminance (0-1)
 */
function getLuminance(hex: string): number {
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;

  const toLinear = (c: number): number => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 * @param foreground - Foreground color hex
 * @param background - Background color hex
 * @returns Contrast ratio (1-21)
 */
function calculateContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
