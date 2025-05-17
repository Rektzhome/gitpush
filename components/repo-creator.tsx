"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FolderPlus, Loader2 } from "lucide-react"
import { createRepository } from "@/app/actions"

interface RepoCreatorProps {
  token: string
}

export function RepoCreator({ token }: RepoCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState("public")
  const [initReadme, setInitReadme] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Repository name required",
        description: "Please enter a name for your repository",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    // Show immediate feedback
    toast({
      title: "Creating repository",
      description: "Please wait while we create your repository...",
    })

    try {
      const result = await createRepository(token, name, description, visibility === "private", initReadme)

      if (result.success) {
        toast({
          title: "Repository created",
          description: `Repository "${name}" has been created successfully`,
        })

        // Reset form
        setName("")
        setDescription("")
        setVisibility("public")
        setInitReadme(true)
      } else {
        toast({
          title: "Creation failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "There was an error creating your repository",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderPlus className="h-5 w-5" />
          Create Repository
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Repository Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of your repository"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={setVisibility} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal">
                  Public - Anyone can see this repository. You choose who can commit.
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal">
                  Private - You choose who can see and commit to this repository.
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="init-readme" className="flex-1">
              Initialize with README
            </Label>
            <Switch id="init-readme" checked={initReadme} onCheckedChange={setInitReadme} />
          </div>

          <Button type="submit" className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4" />
                Create Repository
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
