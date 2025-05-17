"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-6 bg-gray-200 rounded-full flex items-center p-1 cursor-not-allowed opacity-50">
        <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 focus:outline-none ${
        theme === "dark" ? "bg-black justify-end" : "bg-gray-200 justify-start"
      }`}
      aria-label="Toggle dark mode"
    >
      <div className="relative">
        <div
          className={`absolute left-0 transform transition-transform duration-500 ${
            theme === "dark" ? "translate-x-6" : "translate-x-0"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
            {theme === "dark" ? (
              <Moon className="h-3 w-3 text-black" />
            ) : (
              <Sun className="h-3 w-3 text-yellow-500" />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
