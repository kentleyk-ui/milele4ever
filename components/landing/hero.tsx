"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { gsap } from "gsap"
import { Plus } from "lucide-react"

export function Hero() {
  const cardRef = useRef<HTMLDivElement>(null)
  const pixelGridRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)
  const customCursorRef = useRef<HTMLDivElement>(null)
  const [showCustomCursor, setShowCustomCursor] = useState(false)

  // ... (le useEffect reste identique, je ne le recopie pas pour la brièveté)

  return (
    <section className="p-[1.5%] bg-[#0A1F1C]">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <mask id="heroMask" maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill="black" />
            <path
              d="M0 0.1474 V0.9863 C0 0.9938 0.0038 0.9996 0.0085 0.9996 H0.9912 C0.9958 0.9996 1 0.9863 1 0.9863 V0.0581 C1 0.0506 0.9958 0.0444 0.9912 0.0444 H0.9255 C0.9208 0.0444 0.9165 0.0383 0.9165 0.0307 V0.0149 C0.9165 0.0074 0.9132 0.0013 0.9084 0.0013 L0.2060 0.0000 C0.2012 -0.0000 0.1975 0.0061 0.1975 0.0137 V0.0312 C0.1975 0.0387 0.1936 0.0448 0.1889 0.0448 H0.0915 C0.0868 0.0448 0.0830 0.0510 0.0830 0.0585 V0.1201 C0.0830 0.1276 0.0792 0.1337 0.0745 0.1337 H0.0085 C0.0038 0.1337 0 0.1399 0 0.1474 Z"
              fill="white"
            />
          </mask>
        </defs>
      </svg>

      <div className="relative isolate w-full min-h-[calc(100svh-3vh)] sm:min-h-[calc(100svh-3vh)]">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            mask: "url(#heroMask)",
            WebkitMask: "url(#heroMask)",
          }}
        >
          <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/liquid-metal-video_yX6NvjdW-6bLYorR3Ihmlwjivg3pjA978qrSKRU.mp4" type="video/mp4" />
          </video>

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A1F1C]/40 via-transparent to-[#0A1F1C]/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F1C]/50 via-[#0A1F1C]/20 to-transparent" />
            <div className="absolute inset-0 [background:radial-gradient(90%_60%_at_10%_70%,rgba(10,31,28,.65)_0%,transparent_70%)]" />
          </div>

          <div className="absolute bottom-6 left-6 right-6 max-w-[min(46rem,92vw)] md:bottom-8 md:left-8 z-10">
            <div
              ref={cardRef}
              onMouseLeave={handleMouseLeave}
              className="relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 transition-transform duration-500 ease-in hover:scale-[1.01]"
            >
              <div ref={pixelGridRef} className="absolute inset-0 pointer-events-none z-10" />

              <h1 className="text-balance text-3xl/tight sm:text-4xl/tight md:text-5xl/tight tracking-tight text-white">
                Transform Your Vision Into Reality
              </h1>
              <p className="mt-3 text-sm/6 text-white/85 max-w-prose">
                Use GSAP animations alongside Midjourney-generated images and videos to inspire v0 to create something
                users will truly love.
              </p>
              <Link
                href="#demo"
                className="mt-4 inline-flex items-center rounded-full border border-[#0A9C7F]/50 bg-[#0A9C7F]/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-[#0A9C7F]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A9C7F]"
              >
                BUILD WITH v0
              </Link>
            </div>
          </div>
        </div>

        {/* Le reste du code (logo, tags, cursor, bouton PROMPT) reste exactement identique */}

        <div className="absolute left-[1.5%] top-[5%] z-20">
          <Image
            src="/webrenew-icon-xl.png"
            alt="WebRenew Logo"
            width={100}
            height={100}
            className="w-[5%] h-auto object-contain"
          />
        </div>

        <div ref={tagsRef} className="absolute top-[0.75%] left-1/2 -translate-x-1/2 z-20 cursor-none pb-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white font-normal">Made with</span>
            <button className="rounded-full border border-white bg-transparent px-3 py-1 text-xs font-bold text-white">
              Midjourney
            </button>
            <Plus className="w-3 h-3 text-white stroke-[2.5]" />
            <button className="rounded-full border border-white bg-transparent px-3 py-1 text-xs font-bold text-white">
              v0
            </button>
            <span className="text-white font-normal">by</span>
            <button className="rounded-full border border-white bg-transparent px-3 py-1 text-xs font-bold text-white">
              Webrenew
            </button>
          </div>
        </div>

        <div
          ref={customCursorRef}
          className={`fixed w-[30px] h-[30px] rounded-full bg-[#0A9C7F] pointer-events-none z-50 transition-opacity duration-200 ${showCustomCursor ? "opacity-100" : "opacity-0"
            }`}
          style={{ left: 0, top: 0 }}
        />

        <div className="absolute right-[0.85%] top-[0.75%] z-20">
          <Link
            href="#demo"
            className="rounded-full bg-[#0A9C7F] px-4 py-2 text-sm font-mono font-light uppercase tracking-[-0.01em] text-white shadow-md hover:bg-[#088A6F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A9C7F]"
          >
            PROMPT
          </Link>
        </div>
      </div>
    </section>
  )
}