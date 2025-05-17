"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { FileUploader } from "@/components/file-uploader"
import { ReadmeEditor } from "@/components/readme-editor"
import { RepoCreator } from "@/components/repo-creator"
import { RepoManager } from "@/components/repo-manager"
import { Github, LogOut, Loader2, FileUp, FileText, FolderPlus, Trash2 } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upload")
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()

  useEffect(() => {
    // Check if user is authenticated
    setIsLoading(true)
    const storedToken = localStorage.getItem("github_token")
    const storedUser = localStorage.getItem("github_user")

    if (!storedToken) {
      router.push("/auth")
      return
    }

    setToken(storedToken)

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse user data")
      }
    }

    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("github_token")
    localStorage.removeItem("github_user")
    toast({
      title: "Logged out",
      description: "You've been logged out successfully",
    })
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold">Loading Dashboard</h2>
          <p className="mt-2 text-gray-500">Please wait while we fetch your data...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return null // Redirect handled by useEffect
  }

  const navItems = [
    {
      id: "upload",
      label: "File Upload",
      icon: <FileUp className="h-5 w-5" />,
      activeColor: "bg-blue-600 hover:bg-blue-700 text-white",
      component: <FileUploader token={token} username={user?.login} />,
    },
    {
      id: "readme",
      label: "README Editor",
      icon: <FileText className="h-5 w-5" />,
      activeColor: "bg-purple-600 hover:bg-purple-700 text-white",
      component: <ReadmeEditor token={token} username={user?.login} />,
    },
    {
      id: "create",
      label: "Create Repo",
      icon: <FolderPlus className="h-5 w-5" />,
      activeColor: "bg-green-600 hover:bg-green-700 text-white",
      component: <RepoCreator token={token} />,
    },
    {
      id: "manage",
      label: "Manage Repos",
      icon: <Trash2 className="h-5 w-5" />,
      activeColor: "bg-red-600 hover:bg-red-700 text-white",
      component: <RepoManager token={token} username={user?.login} />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-blue-600">GitPush</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <img src={user.avatar_url || "/placeholder.svg"} alt={user.login} className="h-8 w-8 rounded-full" />
                <span className="hidden text-sm font-medium sm:inline-block">{user.login}</span>
              </div>
            )}
            <Button variant="ghost" onClick={handleLogout} className="gap-2 px-4">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">GitHub Repository Manager</h1>

        <div className="grid grid-cols-2 gap-4 mb-6 sm:gap-5 md:grid-cols-4 lg:gap-6 px-2">
          {navItems.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer border transition-all duration-200 max-w-xs mx-auto w-full ${
                activeTab === item.id ? item.activeColor : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="flex flex-col items-center justify-center p-5 text-center">
                {item.icon}
                <span className="mt-2 font-medium text-sm">{item.label}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 px-2">{navItems.find((item) => item.id === activeTab)?.component}</div>
      </main>
    </div>
  )
}
