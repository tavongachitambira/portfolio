import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefAttributes } from "react"

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode
  customClass?: string
}

export const Card: (props: CardProps & RefAttributes<HTMLDivElement>) => ReactNode

export interface CardSwapProps {
  children?: ReactNode
  items?: Array<{ title?: string; image?: string; alt?: string; icon?: ReactNode }>
  width?: number
  height?: number
  cardDistance?: number
  verticalDistance?: number
  depth?: number
  skewAmount?: number
  visibleCards?: number
  delay?: number
  autoplay?: boolean
  pauseOnHover?: boolean
  draggable?: boolean
  speed?: number
  bounce?: number
  parallax?: number
  hoverSpread?: number
  dim?: number
  cardRadius?: number
  intro?: boolean
  theme?: "clay" | "dark" | "light"
  onCardClick?: (index: number) => void
  onChange?: (index: number) => void
  className?: string
  style?: CSSProperties
}

declare const CardSwap: (props: CardSwapProps & RefAttributes<HTMLDivElement>) => ReactNode
export default CardSwap
