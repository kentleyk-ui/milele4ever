"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"

interface LiquidMetalButtonProps {
  label?: string
  onClick?: () => void
  viewMode?: "text" | "icon"
  style?: React.CSSProperties
  width?: number
  height?: number
  fontSize?: number
  tinted?: boolean
  iconNode?: React.ReactNode
  leftIcon?: React.ReactNode
}

export function LiquidMetalButton({ label = "Get Started", onClick, viewMode = "text", width, height, fontSize, tinted = false, iconNode, leftIcon, className, type, disabled, ...rest }: LiquidMetalButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [glowAlt, setGlowAlt] = useState(false)
  const [isLight, setIsLight] = useState(false)
  const [enableShader, setEnableShader] = useState(false)
  const shaderRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const shaderMount = useRef<any>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rippleId = useRef(0)
  const [scale, setScale] = useState(1)
  const isStaffContext = pathname?.startsWith("/staff") || pathname?.startsWith("/admin")
  const accent = isStaffContext ? "blue" : "green"

  // Detect light/dark mode
  useEffect(() => {
    const check = () => setIsLight(!document.documentElement.classList.contains("dark"))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mqCoarse = window.matchMedia("(pointer: coarse)")

    const evaluate = () => {
      const narrowViewport = window.innerWidth < 768
      setEnableShader(!(mqReduced.matches || mqCoarse.matches || narrowViewport))
    }

    evaluate()
    window.addEventListener("resize", evaluate)
    mqReduced.addEventListener("change", evaluate)
    mqCoarse.addEventListener("change", evaluate)

    return () => {
      window.removeEventListener("resize", evaluate)
      mqReduced.removeEventListener("change", evaluate)
      mqCoarse.removeEventListener("change", evaluate)
    }
  }, [])

  const dimensions = useMemo(() => {
    if (width && height) {
      return {
        width,
        height,
        innerWidth: width - 4,
        innerHeight: height - 4,
        shaderWidth: width,
        shaderHeight: height,
      };
    }
    if (viewMode === "icon") {
      return {
        width: 48,
        height: 48,
        innerWidth: 44,
        innerHeight: 44,
        shaderWidth: 48,
        shaderHeight: 48,
      };
    }
    // Valeurs par défaut pour le mode texte
    return {
      width: 120,
      height: 44,
      innerWidth: 116,
      innerHeight: 40,
      shaderWidth: 120,
      shaderHeight: 44,
    };
  }, [width, height, viewMode]);

  // Keep buttons inside narrow containers by scaling down proportionally.
  useEffect(() => {
    const wrapper = wrapperRef.current
    const parent = wrapper?.parentElement
    if (!wrapper || !parent) return

    const updateScale = () => {
      const available = Math.max(parent.clientWidth - 2, 0)
      if (!available || available >= dimensions.width) {
        setScale(1)
        return
      }
      setScale(Math.max(available / dimensions.width, 0.72))
    }

    updateScale()
    let observer: ResizeObserver | null = null
    if (typeof window !== "undefined" && "ResizeObserver" in window) {
      observer = new ResizeObserver(updateScale)
      observer.observe(parent)
    }
    window.addEventListener("resize", updateScale)

    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", updateScale)
    }
  }, [dimensions.width])

  useEffect(() => {
    if (!enableShader) {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy()
        shaderMount.current = null
      }
      return
    }

    const loadShader = async () => {
      try {
        const { liquidMetalFragmentShader, ShaderMount } = await import("@paper-design/shaders")

        if (shaderRef.current) {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy()
          }

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            tinted
              ? {
                  u_repetition: 5,
                  u_softness: 0.55,
                  u_shiftRed: 0.08,
                  u_shiftBlue: 0.12,
                  u_distortion: 0,
                  u_contour: 0,
                  u_angle: 50,
                  u_scale: 7,
                  u_shape: 1,
                  u_offsetX: 0.1,
                  u_offsetY: -0.1,
                }
              : {
                  u_repetition: 4,
                  u_softness: 0.5,
                  u_shiftRed: 0.3,
                  u_shiftBlue: 0.3,
                  u_distortion: 0,
                  u_contour: 0,
                  u_angle: 45,
                  u_scale: 8,
                  u_shape: 1,
                  u_offsetX: 0.1,
                  u_offsetY: -0.1,
                },
            undefined,
            0.6,
          )
        }
      } catch (error) {
        console.error("[v0] Failed to load shader:", error)
      }
    }

    loadShader()

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy()
        shaderMount.current = null
      }
    }
  }, [dimensions.width, dimensions.height, tinted, enableShader])

  const handleMouseEnter = () => {
    setIsHovered(true)
    setGlowAlt((prev) => !prev)
    shaderMount.current?.setSpeed?.(1)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPressed(false)
    shaderMount.current?.setSpeed?.(0.6)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4)
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(1)
        } else {
          shaderMount.current?.setSpeed?.(0.6)
        }
      }, 300)
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const ripple = { x, y, id: rippleId.current++ }

      setRipples((prev) => [...prev, ripple])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
      }, 600)
    }

    onClick?.()
  }

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block max-w-full"
      style={{
        width: `${Math.round(dimensions.width * scale)}px`,
        height: `${Math.round(dimensions.height * scale)}px`,
        willChange: 'transform',
      }}
    >
      <div
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
          willChange: 'transform',
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: "preserve-3d",
            transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
            transform: "none",
            willChange: 'transform',
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, gap 0.4s ease",
              transform: "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
              // Suppression de l'effet de brillance
            }}
          >
            {viewMode === "icon" && (
              iconNode ? (
                <span style={{
                  color: tinted
                    ? accent === "blue"
                      ? (isLight ? "#2563eb" : "#60a5fa")
                      : (isLight ? "#15803d" : "#4ade80")
                    : (isLight ? "#444444" : "#666666"),
                  filter: tinted
                    ? accent === "blue"
                      ? (isLight ? "drop-shadow(0px 1px 2px rgba(37,99,235,0.35))" : "drop-shadow(0px 1px 3px rgba(96,165,250,0.5))")
                      : (isLight ? "drop-shadow(0px 1px 2px rgba(21,128,61,0.35))" : "drop-shadow(0px 1px 3px rgba(74,222,128,0.45))")
                    : (isLight ? "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.2))" : "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))"),
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{iconNode}</span>
              ) : (
                <Sparkles
                  size={fontSize ? fontSize + 2 : 16}
                  style={{
                    color: tinted
                      ? accent === "blue"
                        ? (isLight ? "#2563eb" : "#60a5fa")
                        : (isLight ? "#15803d" : "#4ade80")
                      : (isLight ? "#444444" : "#666666"),
                    filter: tinted
                      ? accent === "blue"
                        ? (isLight ? "drop-shadow(0px 1px 2px rgba(37,99,235,0.35))" : "drop-shadow(0px 1px 3px rgba(96,165,250,0.5))")
                        : (isLight ? "drop-shadow(0px 1px 2px rgba(21,128,61,0.35))" : "drop-shadow(0px 1px 3px rgba(74,222,128,0.45))")
                      : (isLight ? "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.2))" : "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))"),
                    transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: "scale(1)",
                  }}
                />
              )
            )}
            {viewMode === "text" && (
              <span
                style={{
                  fontSize: fontSize ? `${fontSize}px` : "14px",
                  color: tinted
                    ? accent === "blue"
                      ? (isLight ? "#1d4ed8" : "#93c5fd")
                      : (isLight ? "#166534" : "#86efac")
                    : (isLight ? "#333333" : "#666666"),
                  fontWeight: tinted ? 500 : 400,
                  letterSpacing: tinted ? "0.03em" : undefined,
                  textShadow: tinted
                    ? accent === "blue"
                      ? (isLight ? "0px 1px 2px rgba(37,99,235,0.22)" : "0px 1px 3px rgba(96,165,250,0.42)")
                      : (isLight ? "0px 1px 2px rgba(22,101,52,0.22)" : "0px 1px 3px rgba(74,222,128,0.38)")
                    : (isLight ? "0px 1px 1px rgba(0, 0, 0, 0.15)" : "0px 1px 2px rgba(0, 0, 0, 0.5)"),
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: "scale(1)",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {leftIcon ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{leftIcon}</span> : null}
                <span>{label}</span>
              </span>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(10px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: "2px",
                borderRadius: "100px",
                background: tinted
                  ? accent === "blue"
                    ? (isLight ? "linear-gradient(180deg, #e8effe 0%, #c9d8ff 100%)" : "linear-gradient(180deg, #0a1530 0%, #050914 100%)")
                    : (isLight ? "linear-gradient(180deg, #e8f7ee 0%, #c9f0d8 100%)" : "linear-gradient(180deg, #0a2a1a 0%, #05140d 100%)")
                  : (isLight ? "linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%)" : "linear-gradient(180deg, #202020 0%, #000000 100%)"),
                boxShadow: isPressed
                  ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                  : "none",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: "100px",
                border: tinted
                  ? accent === "blue"
                    ? (isLight ? "1px solid rgba(191,219,254,0.65)" : "1px solid rgba(96,165,250,0.42)")
                    : (isLight ? "1px solid rgba(134,239,172,0.58)" : "1px solid rgba(74,222,128,0.38)")
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isPressed
                  ? tinted
                    ? accent === "blue"
                      ? "0px 0px 0px 1px rgba(96,165,250,0.52), inset 0px 1px 0px rgba(255,255,255,0.45), 0px 2px 4px 0px rgba(0, 0, 0, 0.32)"
                      : "0px 0px 0px 1px rgba(74,222,128,0.48), inset 0px 1px 0px rgba(255,255,255,0.45), 0px 2px 4px 0px rgba(0, 0, 0, 0.32)"
                    : "0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                  : isHovered
                    ? tinted
                      ? accent === "blue"
                        ? "0px 0px 0px 1px rgba(96,165,250,0.45), inset 0px 1px 0px rgba(255,255,255,0.5), 0px 16px 8px 0px rgba(0, 0, 0, 0.07), 0px 10px 7px 0px rgba(0, 0, 0, 0.12), 0px 5px 5px 0px rgba(0, 0, 0, 0.18), 0px 0px 28px rgba(59,130,246,0.28)"
                        : "0px 0px 0px 1px rgba(74,222,128,0.42), inset 0px 1px 0px rgba(255,255,255,0.5), 0px 16px 8px 0px rgba(0, 0, 0, 0.07), 0px 10px 7px 0px rgba(0, 0, 0, 0.12), 0px 5px 5px 0px rgba(0, 0, 0, 0.18), 0px 0px 28px rgba(34,197,94,0.26)"
                      : "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 12px 6px 0px rgba(0, 0, 0, 0.05), 0px 8px 5px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.2)"
                    : tinted
                      ? accent === "blue"
                        ? "0px 0px 0px 1px rgba(96,165,250,0.35), inset 0px 1px 0px rgba(255,255,255,0.4), 0px 38px 16px 0px rgba(0, 0, 0, 0.03), 0px 22px 13px 0px rgba(0, 0, 0, 0.1), 0px 10px 10px 0px rgba(0, 0, 0, 0.14), 0px 0px 16px rgba(59,130,246,0.18)"
                        : "0px 0px 0px 1px rgba(74,222,128,0.33), inset 0px 1px 0px rgba(255,255,255,0.4), 0px 38px 16px 0px rgba(0, 0, 0, 0.03), 0px 22px 13px 0px rgba(0, 0, 0, 0.1), 0px 10px 10px 0px rgba(0, 0, 0, 0.14), 0px 0px 16px rgba(34,197,94,0.17)"
                      : "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "rgb(0 0 0 / 0)",
              }}
            >
              {tinted && (
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: "10px",
                    right: "10px",
                    height: "28%",
                    borderRadius: "999px",
                    background: isLight
                      ? "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.08))"
                      : accent === "blue"
                        ? "linear-gradient(180deg, rgba(191,219,254,0.35), rgba(191,219,254,0.02))"
                        : "linear-gradient(180deg, rgba(134,239,172,0.3), rgba(134,239,172,0.02))",
                    pointerEvents: "none",
                    zIndex: 12,
                  }}
                />
              )}
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: `${dimensions.shaderWidth}px`,
                  maxWidth: `${dimensions.shaderWidth}px`,
                  height: `${dimensions.shaderHeight}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                  filter: tinted
                    ? accent === "blue"
                      ? (isLight ? "sepia(0.2) hue-rotate(172deg) saturate(0.9) brightness(1.62)" : "sepia(0.28) hue-rotate(172deg) saturate(1.05) brightness(1.08)")
                      : (isLight ? "sepia(0.22) hue-rotate(78deg) saturate(1.0) brightness(1.62)" : "sepia(0.3) hue-rotate(78deg) saturate(1.1) brightness(1.06)")
                    : (isLight ? "brightness(1.5) contrast(0.85)" : "none"),
                  background: enableShader
                    ? "transparent"
                    : tinted
                      ? accent === "blue"
                        ? (isLight ? "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)" : "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #1e40af 100%)")
                        : (isLight ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)" : "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)")
                      : (isLight ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)" : "linear-gradient(135deg, #111827 0%, #1f2937 100%)"),
                }}
              />
              {/* Blue tint overlay for themed buttons */}
              {tinted && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "100px",
                    background: accent === "blue" ? "rgba(59,130,246,0.16)" : "rgba(34,197,94,0.14)",
                    mixBlendMode: "color",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>

          <button
            ref={buttonRef}
            type={type ?? "button"}
            disabled={disabled}
            className={className}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              background: "transparent",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: "preserve-3d",
              transform: "translateZ(25px)",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              overflow: "hidden",
              borderRadius: "100px",
              opacity: disabled ? 0.65 : 1,
            }}
            aria-label={label}
            {...rest}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: tinted
                    ? accent === "blue"
                      ? "radial-gradient(circle, rgba(96,165,250,0.52) 0%, rgba(59,130,246,0) 70%)"
                      : "radial-gradient(circle, rgba(74,222,128,0.5) 0%, rgba(34,197,94,0) 70%)"
                    : "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "ripple-animation 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  )
}
