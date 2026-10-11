"use client"

import { useId, useState } from "react"

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

  const select = (item: FolderFloatItem & { value: string }, index: number) => {
    onSelect?.(item.value, index)
    if (closeOnSelect) setOpen(false)
  }

  return (
    <div
      className="folder-float"
      data-open={open || undefined}
      data-physics={physics || undefined}
      onPointerEnter={trigger === "hover" ? () => setOpen(true) : undefined}
      onPointerLeave={trigger === "hover" ? () => setOpen(false) : undefined}
      onFocusCapture={trigger === "hover" ? () => setOpen(true) : undefined}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
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
        <button type="button" className="folder-float__trigger" aria-expanded={open} aria-label={`${label}, ${noteCount}`} onClick={() => setOpen(!open)} />
      </div>
    </div>
  )
}
