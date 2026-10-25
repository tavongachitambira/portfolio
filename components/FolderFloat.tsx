"use client"

import { useEffect, useId, useRef, useState } from "react"

import "./FolderFloat.css"

export type FolderFloatItem = {
  label: string
  value?: string
}

type FolderFloatProps = {
  items: Array<string | FolderFloatItem>
  label: string
  sublabel?: string
  trigger?: "hover" | "click"
  closeOnSelect?: boolean
  /** How long (ms) the folder stays open after a click, so the items can be read. */
  holdMs?: number
  physics?: boolean
  drift?: number
  onSelect?: (value: string, index: number) => void
  folderColor?: string
  frontColor?: string
  paperColor?: string
  itemColor?: string
  itemTextColor?: string
  labelColor?: string
  width?: number
  height?: number
  radius?: number
  spread?: number
  lift?: number
  tilt?: number
  flapAngle?: number
  restAngle?: number
  openDuration?: number
  stagger?: number
  bounce?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function FolderFloat({
  items,
  label,
  sublabel,
  trigger = "hover",
  closeOnSelect = true,
  holdMs = 3200,
  physics = true,
  drift = 0.5,
  onSelect,
  folderColor = "#3f3f46",
  frontColor = "#52525b",
  paperColor = "#f5f5f5",
  itemColor = "#f5f5f5",
  itemTextColor = "#18181b",
  labelColor = "#f5f5f5",
  width = 200,
  height = 148,
  radius = 14,
  spread = 180,
  lift = 26,
  tilt = 8,
  flapAngle = 34,
  restAngle = 16,
  openDuration = 520,
  stagger = 45,
  bounce = 0.3,
  open: controlledOpen,
  onOpenChange,
}: FolderFloatProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const descriptionId = useId()
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }
  const list = items.map((item) => (typeof item === "string" ? { label: item, value: item } : { ...item, value: item.value ?? item.label }))
  const noteCount = sublabel ?? `${list.length} ${list.length === 1 ? "skill" : "skills"}`

  /* A click "pins" the folder open for `holdMs` so it never flashes open and shut:
     - hover mode: hover already opened it, so a click used to toggle it closed. It now pins it instead.
     - picking an item no longer closes it on the spot; it closes after the hold.
     When the hold ends it closes, unless the pointer is still over it (hover mode). */
  const pinned = useRef(false)
  const hovering = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  const clearHold = () => {
    if (timer.current !== undefined) window.clearTimeout(timer.current)
    timer.current = undefined
  }
  const hold = () => {
    pinned.current = true
    clearHold()
    timer.current = window.setTimeout(() => {
      pinned.current = false
      timer.current = undefined
      if (trigger === "click" || !hovering.current) setOpen(false)
    }, holdMs)
  }
  useEffect(() => clearHold, [])

  const toggle = () => {
    if (trigger === "hover") {
      setOpen(true)
      hold()
      return
    }
    // click mode (touch): tap to open, tap again to close
    if (open) {
      clearHold()
      pinned.current = false
      setOpen(false)
    } else {
      setOpen(true)
    }
  }

  const select = (item: FolderFloatItem & { value: string }, index: number) => {
    onSelect?.(item.value, index)
    if (closeOnSelect) hold()
  }

  return (
    <div
      className="folder-float"
      data-open={open || undefined}
      data-physics={physics || undefined}
      onPointerEnter={
        trigger === "hover"
          ? () => {
              hovering.current = true
              setOpen(true)
            }
          : undefined
      }
      onPointerLeave={
        trigger === "hover"
          ? () => {
              hovering.current = false
              if (!pinned.current) setOpen(false)
            }
          : undefined
      }
      onFocusCapture={trigger === "hover" ? () => setOpen(true) : undefined}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          clearHold()
          pinned.current = false
          setOpen(false)
        }
      }}
      style={{
        "--ff-w": `${width}px`, "--ff-h": `${height}px`, "--ff-r": `${radius}px`,
        "--ff-back": folderColor, "--ff-front": frontColor, "--ff-paper": paperColor,
        "--ff-item": itemColor, "--ff-item-ink": itemTextColor, "--ff-label": labelColor,
        "--ff-spread": `${spread}px`, "--ff-lift": `${lift}px`, "--ff-angle": `${flapAngle}deg`,
        "--ff-rest": `${restAngle}deg`, "--ff-open": `${openDuration}ms`, "--ff-stagger": `${stagger}ms`,
        "--ff-bounce": `${1 + bounce * 1.9}`, "--ff-drift": `${drift * 3}px`, "--ff-n": list.length,
      } as React.CSSProperties}
    >
      <div className="folder-float__items" aria-describedby={descriptionId}>
        {list.map((item, index) => {
          const angle = ((index / Math.max(list.length - 1, 1)) - 0.5) * tilt * 2
          const x = ((index - (list.length - 1) / 2) / Math.max(list.length - 1, 1)) * spread
          const y = -lift - (index % 2) * 48
          return (
            <button
              key={item.value}
              type="button"
              className="folder-float__item"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              onClick={() => select(item, index)}
              style={{ "--i": index, "--x": `${x}px`, "--y": `${y}px`, "--r": `${angle}deg` } as React.CSSProperties}
            >
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="folder-float__folder">
        <span className="folder-float__back" aria-hidden="true" />
        <span className="folder-float__paper" aria-hidden="true" />
        <span className="folder-float__front" aria-hidden="true">
          <span className="folder-float__label">{label}</span>
          <span id={descriptionId} className="folder-float__sub">{noteCount}</span>
        </span>
        <button type="button" className="folder-float__trigger" aria-expanded={open} aria-label={`${label}, ${noteCount}`} onClick={toggle} />
      </div>
    </div>
  )
}