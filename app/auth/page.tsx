"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function AuthPage() {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: "Token required",
        description: "Please enter your GitHub token",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()

      if (result.valid) {
        // Store token and user info in localStorage
        localStorage.setItem("github_token", token)
        localStorage.setItem("github_user", JSON.stringify(result.user))

        toast({
          title: "Authentication successful",
          description: `Welcome, ${result.user?.login || 'User'}!`,
        })

        // Add small delay to ensure localStorage is saved
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        toast({
          title: "Authentication failed",
          description: result.error || "Invalid GitHub token",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Please check your token and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center">
            <Github className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">GitHub Authentication</CardTitle>
          <CardDescription className="text-center">Enter your GitHub token to connect your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">GitHub Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10"
                />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                Need a token? Go to GitHub Settings &gt; Developer settings &gt; Personal access tokens &gt; Tokens
                (classic) &gt; Generate new token
              </p>
              <p className="text-xs text-gray-500">
                Required scopes: <span className="font-semibold">repo, delete_repo</span>
              </p>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Connect to GitHub"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
