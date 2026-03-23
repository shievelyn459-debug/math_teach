/**
 * Responsive hooks for tablet-optimized layouts
 *
 * These hooks help components adapt to different screen sizes and orientations.
 */

import { useWindowDimensions } from 'react-native';
import { getBreakpoint, isLandscape } from '../styles/tablet';
import { ScreenSize, Orientation, TabletConfig } from '../types';

/**
 * Hook to detect screen size category
 * @returns ScreenSize enum value
 */
export const useScreenSize = (): ScreenSize => {
  const { width } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  switch (breakpoint) {
    case 'small':
      return ScreenSize.SMALL_TABLET;
    case 'medium':
      return ScreenSize.MEDIUM_TABLET;
    case 'large':
      return ScreenSize.LARGE_TABLET;
    default:
      return ScreenSize.SMALL_TABLET;
  }
};

/**
 * Hook to detect device orientation
 * @returns Orientation enum value
 */
export const useOrientation = (): Orientation => {
  const { width, height } = useWindowDimensions();
  return isLandscape(width, height)
    ? Orientation.LANDSCAPE
    : Orientation.PORTRAIT;
};

/**
 * Hook to get complete tablet configuration
 * @returns TabletConfig with all responsive info
 */
export const useTabletConfig = (): TabletConfig => {
  const { width, height } = useWindowDimensions();
  const screenSize = useScreenSize();
  const orientation = useOrientation();

  return {
    screenWidth: width,
    screenHeight: height,
    screenSize,
    orientation,
    isTablet: width >= 600, // 600dp is the minimum tablet width
  };
};
