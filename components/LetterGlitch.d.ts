   import type { ComponentType, CSSProperties } from "react"

   declare const LetterGlitch: ComponentType<{
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
   }>
   export default LetterGlitch