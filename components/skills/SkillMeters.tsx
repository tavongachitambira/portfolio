"use client"

import { useEffect, useState } from "react"

import FolderFloat from "@/components/FolderFloat"
import { useIsMobile } from "@/hooks/useIsMobile"
import { skillGroups } from "@/lib/data/skills"

/* The full skills page: each group is a two-column block, meters on the right. */
export function SkillMeters() {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    setOpenGroup(null)
  }, [isMobile])

  return <section aria-label="Skill sets" className="grid gap-x-8 gap-y-24 py-16 sm:grid-cols-2 lg:grid-cols-3">
    {skillGroups.map((group, index) => <div key={group.id} className="flex min-h-52 items-end justify-center">
      <FolderFloat
        key={`${isMobile ? "mobile" : "desktop"}-${group.id}`}
        items={group.items.map((skill) => ({ label: `${skill.name}${skill.learning ? " · learning" : ""}` }))}
        label={group.title}
        sublabel={group.blurb}
        trigger={isMobile ? "click" : "hover"}
        closeOnSelect
        open={openGroup === group.id}
        onOpenChange={(open) => setOpenGroup(open ? group.id : null)}
        physics
        drift={0.5}
        onSelect={(value, itemIndex) => console.log(value, itemIndex)}
        folderColor={["#8d5b5b", "#705a84", "#557b78", "#9a7149", "#7b6875"][index]}
        frontColor={["#b6736d", "#8d76a0", "#679a93", "#bd8a57", "#9a8291"][index]}
        paperColor="#f5f5f5"
        itemColor="#f5f5f5"
        itemTextColor="#18181b"
        labelColor="#f5f5f5"
        width={200}
        height={148}
        radius={14}
        spread={180}
        lift={26}
        tilt={8}
        flapAngle={34}
        restAngle={16}
        openDuration={520}
        stagger={45}
        bounce={0.3}
      />
    </div>)}
  </section>
}
