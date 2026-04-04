/**
 * UI Component Library
 *
 * 统一UI组件库入口
 * 所有组件都使用设计系统 Token 确保样式一致性
 *
 * @example
 * ```tsx
 * import {Button, Card, Icon, Typography, Spacer} from '../components/ui';
 *
 * <Card variant="elevated" padding="lg">
 *   <Typography variant="headlineMedium">标题</Typography>
 *   <Spacer size="md" />
 *   <Typography variant="body">内容文字</Typography>
 *   <Spacer size="lg" />
 *   <Button title="确定" onPress={handlePress} />
 * </Card>
 * ```
 */

// ============================================================================
// BUTTON
// ============================================================================

export {Button} from './Button';
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
} from './Button/Button.types';

// ============================================================================
// CARD
// ============================================================================

export {Card} from './Card';
export type {CardProps, CardVariant} from './Card/Card.types';

// ============================================================================
// ICON
// ============================================================================

export {Icon} from './Icon';
export type {IconProps, IconSize} from './Icon/Icon.types';

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export {Typography} from './Typography';
export type {
  TypographyProps,
  TypographyVariant,
  TypographyAlign,
} from './Typography/Typography.types';

// ============================================================================
// SPACING
// ============================================================================

export {Spacer, VSpacer, HSpacer} from './Spacing';
export type {SpacerProps} from './Spacing/Spacer';
