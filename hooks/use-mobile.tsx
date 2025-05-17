"use client"

import { useState, useEffect } from "react"

export function useMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== "undefined") {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < breakpoint)
      }

      // Initial check
      checkIsMobile()

      // Add event listener for window resize
      window.addEventListener("resize", checkIsMobile)

      // Clean up
      return () => {
        window.removeEventListener("resize", checkIsMobile)
      }
    }
  }, [breakpoint])

  return isMobile
}
