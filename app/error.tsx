"use client"

import { useEffect } from "react"

import { StatusPage } from "@/components/layout/StatusPage"

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      code="500"
      title="Something went wrong"
      message="An unexpected error happened on my end. Head back home and try again."
      digest={error.digest}
    />
  )
}