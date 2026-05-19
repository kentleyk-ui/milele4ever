"use client"

import dynamic from "next/dynamic"

const AudioPlayer = dynamic(() => import("@/components/AudioPlayer"), { ssr: false })

interface AudioPlayerWrapperProps {
  autoPlayOnLoad?: boolean
  autoPlayDelayMs?: number
}

export default function AudioPlayerWrapper({ autoPlayOnLoad = false, autoPlayDelayMs = 0 }: AudioPlayerWrapperProps) {
  return <AudioPlayer autoPlayOnLoad={autoPlayOnLoad} autoPlayDelayMs={autoPlayDelayMs} />
}
