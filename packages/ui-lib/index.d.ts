export { LiquidMetalGold, GoldBadge, GoldDivider };
export type { LiquidMetalGoldProps, GoldBadgeProps, GoldDividerProps };

interface LiquidMetalGoldProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  disabled?: boolean;
}

interface GoldBadgeProps {
  children: React.ReactNode;
  className?: string;
}

interface GoldDividerProps {
  className?: string;
}

declare function LiquidMetalGold(props: LiquidMetalGoldProps): JSX.Element;
declare function GoldBadge(props: GoldBadgeProps): JSX.Element;
declare function GoldDivider(props: GoldDividerProps): JSX.Element;
