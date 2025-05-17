"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Search, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getUserRepositories, deleteRepository } from "@/app/actions"

interface RepoManagerProps {
  token: string
  username: string
}

export function RepoManager({ token, username }: RepoManagerProps) {
  const [repositories, setRepositories] = useState<any[]>([])
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [hasMore, setHasMore] = useState(true)

  const filteredRepos = repositories.filter((repo) => repo.name.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!token) return

      setIsLoading(true)
      try {
        const result = await getUserRepositories(token, page, perPage)
        if (result.success) {
          if (page === 1) {
            setRepositories(result.repositories)
          } else {
            setRepositories((prev) => [...prev, ...result.repositories])
          }
          setHasMore(result.repositories.length === perPage)
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
        setIsLoading(false)
      }
    }

    fetchRepositories()
  }, [token, toast, page, perPage])

  const handleSelectRepo = (name: string) => {
    setSelectedRepos((prev) => (prev.includes(name) ? prev.filter((repoName) => repoName !== name) : [...prev, name]))
  }

  const handleSelectAll = () => {
    if (selectedRepos.length === filteredRepos.length) {
      setSelectedRepos([])
    } else {
      setSelectedRepos(filteredRepos.map((repo) => repo.name))
    }
  }

  const handleDeleteConfirm = async () => {
    if (selectedRepos.length === 0) {
      toast({
        title: "No repositories selected",
        description: "Please select repositories to delete",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      let successCount = 0
      let failCount = 0

      for (const repoName of selectedRepos) {
        const result = await deleteRepository(token, username, repoName)

        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      // Refresh repository list
      const result = await getUserRepositories(token, page, perPage)
      if (result.success) {
        setRepositories(result.repositories)
      }

      if (failCount === 0) {
        toast({
          title: "Repositories deleted",
          description: `${successCount} repositories have been deleted`,
        })
      } else {
        toast({
          title: "Deletion partially complete",
          description: `Deleted ${successCount} repositories, ${failCount} failed`,
          variant: "destructive",
        })
      }

      // Reset selection
      setSelectedRepos([])
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the repositories",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Manage Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {isLoading && repositories.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRepos.length === filteredRepos.length && filteredRepos.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all repositories"
                          />
                        </TableHead>
                        <TableHead>Repository</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRepos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No repositories found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRepos.map((repo) => (
                          <TableRow key={repo.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRepos.includes(repo.name)}
                                onCheckedChange={() => handleSelectRepo(repo.name)}
                                aria-label={`Select ${repo.name}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{repo.name}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  repo.private ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                                }`}
                              >
                                {repo.private ? "Private" : "Public"}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(repo.created_at)}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(repo.updated_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {!isLoading && hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} className="gap-2">
                  Load More Repositories
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={selectedRepos.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedRepos.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Repositories
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRepos.length} repositories? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
