"use client"

import { useEffect, useState } from "react"

/** Types `text` out one character at a time, then leaves a blinking cursor. */
export function TypedText({
  text,
  speed = 110,
  className,
}: {
  text: string
  speed?: number
  className?: string
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (count >= text.length) return
    const id = setTimeout(() => setCount((n) => n + 1), speed)
    return () => clearTimeout(id)
  }, [count, text, speed])

  return (
    <p className={className} aria-label={text}>
      <span aria-hidden>
        {text.slice(0, count)}
        <span className="ml-0.5 inline-block animate-[blink_0.8s_steps(2,start)_infinite]">_</span>
      </span>
    </p>
  )
}