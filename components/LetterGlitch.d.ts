import type { CSSProperties } from "react"

export interface LetterGlitchProps {
  glitchColors?: string[]
  baseColor?: string
  characters?: string
  fontFamily?: string
  fontSize?: number
  spacing?: number
  density?: number
  baseOpacity?: number
  glitchAmount?: number
  speed?: number
  smooth?: boolean
  interactive?: boolean
  cursorRadius?: number
  clickEffect?: "tear" | "burst" | "none"
  flow?: number
  edgeFade?: number
  centerFade?: number
  intro?: boolean
  lightMode?: boolean
  backgroundColor?: string
  dpr?: number
  className?: string
  style?: CSSProperties
}

declare const LetterGlitch: (props: LetterGlitchProps) => JSX.Element
export default LetterGlitch