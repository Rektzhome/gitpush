"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FileText, Loader2 } from "lucide-react"
import { getUserRepositories, getRepositoryBranches, getReadmeContent, updateReadme } from "@/app/actions"
import ReactMarkdown from "react-markdown"

interface ReadmeEditorProps {
  token: string
  username: string
}

export function ReadmeEditor({ token, username }: ReadmeEditorProps) {
  const [repository, setRepository] = useState("")
  const [branch, setBranch] = useState("")
  const [content, setContent] = useState("")
  const [readmeSha, setReadmeSha] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const [isLoadingReadme, setIsLoadingReadme] = useState(false)
  const [repositories, setRepositories] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!token) return

      setIsLoadingRepos(true)
      try {
        const result = await getUserRepositories(token)
        if (result.success) {
          setRepositories(result.repositories)
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch repositories",
          variant: "destructive",
        })
      } finally {
        setIsLoadingRepos(false)
      }
    }

    fetchRepositories()
  }, [token, toast])

  useEffect(() => {
    const fetchBranches = async () => {
      if (!token || !repository || !username) return

      setBranch("")
      setIsLoadingBranches(true)
      try {
        const result = await getRepositoryBranches(token, username, repository)
        if (result.success) {
          setBranches(result.branches)
          if (result.branches.length > 0) {
            // Set default branch
            const defaultBranch =
              result.branches.find((b: any) => b.name === "main" || b.name === "master") || result.branches[0]
            setBranch(defaultBranch.name)
          }
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch branches",
          variant: "destructive",
        })
      } finally {
        setIsLoadingBranches(false)
      }
    }

    if (repository) {
      fetchBranches()
    }
  }, [token, repository, username, toast])

  useEffect(() => {
    const fetchReadme = async () => {
      if (!token || !repository || !branch || !username) return

      setIsLoadingReadme(true)
      setContent("")
      setReadmeSha(null)

      try {
        const result = await getReadmeContent(token, username, repository, branch)
        if (result.success) {
          setContent(result.content)
          setReadmeSha(result.sha)
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch README",
          variant: "destructive",
        })
      } finally {
        setIsLoadingReadme(false)
      }
    }

    if (repository && branch) {
      fetchReadme()
    }
  }, [token, repository, branch, username, toast])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!repository) {
      toast({
        title: "Repository required",
        description: "Please select a repository",
        variant: "destructive",
      })
      return
    }

    if (!branch) {
      toast({
        title: "Branch required",
        description: "Please select a branch",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const result = await updateReadme(token, username, repository, content, branch, readmeSha)

      if (result.success) {
        toast({
          title: "README saved",
          description: `README.md saved to ${repository}/${branch}`,
        })

        // Update SHA for future updates
        if (result.data && result.data.content && result.data.content.sha) {
          setReadmeSha(result.data.content.sha)
        }
      } else {
        toast({
          title: "Save failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your README",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const debouncedSetRepository = useCallback((value: string) => {
    // Clear any existing content and set loading state
    setContent("")
    setReadmeSha(null)
    setRepository(value)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          README Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repository">Repository</Label>
              <Select value={repository} onValueChange={debouncedSetRepository} disabled={isLoadingRepos}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingRepos ? "Loading repositories..." : "Select repository"} />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.name}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={branch} onValueChange={setBranch} disabled={!repository || isLoadingBranches}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">README.md Content</Label>
            {isLoadingReadme ? (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">Loading README content...</p>
                <p className="text-xs text-gray-400 mt-2">This may take a moment depending on the file size</p>
              </div>
            ) : (
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Your README content here"
                    className="min-h-[300px] font-mono"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white p-4">
                    <div className="prose max-w-none">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            disabled={isSaving || !repository || !branch || isLoadingReadme}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Save README
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
