"use client"

import { useState } from "react"

import FolderFloat from "@/components/FolderFloat"
import { useIsMobile } from "@/hooks/useIsMobile"
import { SKILLS_PREVIEW_GROUPS, skillGroups } from "@/lib/data/skills"

/* A compact interactive preview of the stack. */
export function SkillsPreview() {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const isMobile = useIsMobile()

  return (
    <div className="grid gap-x-6 gap-y-20 pt-12 sm:grid-cols-2">
      {skillGroups.slice(0, SKILLS_PREVIEW_GROUPS).map((group, i) => (
        <div
          key={group.id}
          className="flex min-h-48 items-end justify-center"
        >
          <FolderFloat
            items={group.items.map((skill) => ({
              label: `${skill.name}${skill.learning ? " · learning" : ""}`,
            }))}
            label={group.title}
            sublabel={`${group.items.length} skills`}
            trigger={isMobile ? "click" : "hover"}
            closeOnSelect
            open={openGroup === group.id}
            onOpenChange={(open) => setOpenGroup(open ? group.id : null)}
            physics
            drift={0.5}
            folderColor={["#8d5b5b", "#705a84", "#557b78", "#9a7149"][i]}
            frontColor={["#b6736d", "#8d76a0", "#679a93", "#bd8a57"][i]}
            paperColor="#f5f5f5"
            itemColor="#f5f5f5"
            itemTextColor="#18181b"
            labelColor="#f5f5f5"
            width={170}
            height={130}
            radius={14}
            spread={250}
            lift={26}
            tilt={8}
            flapAngle={34}
            restAngle={16}
            openDuration={520}
            stagger={45}
            bounce={0.3}
          />
        </div>
      ))}
    </div>
  )
}
