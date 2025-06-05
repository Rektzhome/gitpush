"use client";

import { useEffect, useState, useMemo } from "react";
import { getUserRepositories, createRepository, deleteRepository, getReadmeContent, updateReadme, updateRepositoryDetails, getRepositoryDetails } from "../app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, GitFork, Star, Triangle, ExternalLink, Pencil, Trash2, BookOpen, Save, XCircle, Github, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // For ShadCN Checkbox

// Define the structure of a repository object based on GitHub API response
interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
  description: string | null;
  html_url: string;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  topics?: string[];
  default_branch?: string;
  clone_url?: string;
  ssh_url?:string;
  homepage?: string | null; 
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  open_issues_count?: number;
}

// Define the structure for README content
interface ReadmeContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string; // Base64 encoded content
  encoding: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

interface EditRepoFormData {
  description: string;
  homepage: string;
  private: boolean;
  has_issues: boolean; // No longer optional, will have default
  has_projects: boolean; // No longer optional
  has_wiki: boolean; // No longer optional
}


function RepoManager({ token }: { token: string }) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("full_name");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const [readmeContent, setReadmeContent] = useState<ReadmeContent | null>(null);
  const [isReadmeLoading, setIsReadmeLoading] = useState(false);
  const [editingReadmeRepo, setEditingReadmeRepo] = useState<Repository | null>(null);
  const [currentReadmeSha, setCurrentReadmeSha] = useState<string | null>(null);
  const [readmeEditorContent, setReadmeEditorContent] = useState("");
  const [isSavingReadme, setIsSavingReadme] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  const [repoToClone, setRepoToClone] = useState<Repository | null>(null);
  const [clonePath, setClonePath] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteRepoNameInput, setDeleteRepoNameInput] = useState("");

  // State for Edit Repository Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null); 
  const [editFormData, setEditFormData] = useState<EditRepoFormData>({
    description: "",
    homepage: "",
    private: false,
    has_issues: true, 
    has_projects: true,
    has_wiki: true,
  });
  const [isUpdatingRepo, setIsUpdatingRepo] = useState(false);
  const [isFetchingRepoDetails, setIsFetchingRepoDetails] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getUserRepositories(token, 1, 50);
    if (result.success && result.repositories) {
      setRepositories(result.repositories);
    } else {
      setError(result.error || "Failed to fetch repositories.");
      toast.error(result.error || "Failed to fetch repositories.");
    }
    setIsLoading(false);
  };

  const handleCreateRepository = async () => {
    if (!newRepoName.trim()) {
      toast.error("Repository name cannot be empty.");
      return;
    }
    setIsCreatingRepo(true);
    toast.info(`Creating repository "${newRepoName}"...`);
    const result = await createRepository(token, newRepoName, newRepoDescription, newRepoPrivate, true);
    setIsCreatingRepo(false);
    if (result.success && result.repository) {
      toast.success(`Repository "${result.repository.name}" created successfully!`);
      setRepositories(prev => [result.repository, ...prev]); // Add to list
      setIsCreateModalOpen(false);
      setNewRepoName("");
      setNewRepoDescription("");
      setNewRepoPrivate(true);
    } else {
      toast.error(`Failed to create repository: ${result.error}`);
    }
  };

  const handleOpenCloneModal = (repo: Repository) => {
    setRepoToClone(repo);
    setClonePath(`cloned-${repo.name}`); // Suggest a default path
    setIsCloneModalOpen(true);
  };

  const handleCloneConfirm = async () => {
    if (!repoToClone || !clonePath.trim()) {
      toast.error("Repository and local path must be specified for cloning.");
      return;
    }
    setIsCloning(true);
    toast.info(`Initiating clone for "${repoToClone.full_name}" into "${clonePath}"...`);
    
    // Directly call the backend API exposed by Next.js (which then calls Python)
    const response = await fetch('/api/clone', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Or however your API route expects the token
        },
        body: JSON.stringify({ 
            github_token: token, // Send token if Python script needs it directly
            repo_url: repoToClone.clone_url, 
            local_path: clonePath 
        }),
    });

    setIsCloning(false);
    const result = await response.json();

    if (response.ok) {
        toast.success(result.message || `Repository "${repoToClone.full_name}" cloned successfully to server path "${clonePath}".`);
        setIsCloneModalOpen(false);
        setRepoToClone(null);
        setClonePath("");
         // Potentially add to a list of "cloned on server" repos if UI needs to reflect this
    } else {
        toast.error(result.error || `Failed to clone repository: ${repoToClone.full_name}.`);
    }
  };

  const handleOpenDeleteModal = (repo: Repository) => {
    setRepoToDelete(repo);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!repoToDelete || deleteRepoNameInput !== repoToDelete.name) {
      toast.error("Repository name mismatch or no repository selected.");
      return;
    }
    setIsDeleting(true);
    toast.info(`Deleting repository "${repoToDelete.full_name}"...`);
    const result = await deleteRepository(token, repoToDelete.owner.login, repoToDelete.name);
    setIsDeleting(false);
    if (result.success) {
      toast.success(`Repository "${repoToDelete.full_name}" deleted successfully.`);
      setRepositories(prev => prev.filter(r => r.id !== repoToDelete.id));
      handleDeleteCancel(); // Close modal and reset state
    } else {
      toast.error(`Failed to delete repository: ${result.error}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteRepoNameInput("");
    setIsDeleteConfirmOpen(false);
    setRepoToDelete(null);
  };

  const handleViewReadme = async (repo: Repository) => {
    setEditingReadmeRepo(repo); // Also used to indicate which repo's README modal is for
    setReadmeContent(null); // Clear previous content
    setIsReadmeLoading(true);
    // toast.info(`Fetching README for ${repo.name}...`); // Optional: can be too noisy
    
    const result = await getReadmeContent(token, repo.owner.login, repo.name);
    setIsReadmeLoading(false);
    if (result.success && result.content) {
      setReadmeContent(result as any); // Cast to match interface
      try {
        setReadmeEditorContent(result.content);
      } catch (e) {
        console.error("Error decoding README:", e);
        toast.error("Error decoding README content.");
        setReadmeEditorContent("# Error: Could not decode README content.");
      }
      setCurrentReadmeSha(result.sha);
    } else {
      // toast.error(`Failed to load README: ${result.error}`);
      setReadmeEditorContent(`# No README.md found for ${repo.name}\n\nYou can create one now.`);
      setCurrentReadmeSha(null); // No existing SHA
    }
  };

  const handleSaveReadme = async () => {
    if (!editingReadmeRepo || readmeEditorContent === null) return;

    setIsSavingReadme(true);
    toast.info(`Saving README for ${editingReadmeRepo.full_name}...`);

    // Encode content to Base64
    const newEncodedContent = Buffer.from(readmeEditorContent).toString('base64');

    const result = await updateReadme(
      token,
      editingReadmeRepo.owner.login,
      editingReadmeRepo.name,
      newEncodedContent,
      "main", // branch
      currentReadmeSha // Pass the current SHA for updates, null for new file
    );
    setIsSavingReadme(false);

    if (result.success && result.data) {
      toast.success("README updated successfully!");
      // Update SHA for next save, and potentially the content if API returns it
      setCurrentReadmeSha(result.data.content?.sha || null);
      // Optionally close modal or show further indication
      setEditingReadmeRepo(null); 
    } else {
      toast.error(`Failed to save README: ${result.error}`);
    }
  };
  
  const handleOpenEditModal = async (repo: Repository) => {
    setEditingRepo(repo); 
    setIsFetchingRepoDetails(true);
    // toast.info(`Fetching details for ${repo.name}...`); // Can be a bit noisy

    const result = await getRepositoryDetails(token, repo.owner.login, repo.name);
    setIsFetchingRepoDetails(false);

    if (result.success && result.repository) {
      setEditingRepo(result.repository); 
      // Form data is set in useEffect based on editingRepo and isEditModalOpen
      setIsEditModalOpen(true); // Open modal after details are fetched and editingRepo is set
    } else {
      toast.error(`Failed to fetch repository details: ${result.error}`);
      setEditingRepo(null); 
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: name === 'private' ? value === 'true' : value }));
  };
  
  const handleEditFormShadCNCheckboxChange = (field: keyof EditRepoFormData) => (checked: boolean | 'indeterminate') => {
    // Assuming 'indeterminate' is not used, or should default to false/true
    setEditFormData(prev => ({ ...prev, [field]: Boolean(checked) }));
  };

  const handleSaveChanges = async () => {
    if (!editingRepo) return;
    setIsUpdatingRepo(true);
    toast.info(`Updating ${editingRepo.full_name}...`);

    const detailsToUpdate: Partial<EditRepoFormData> = {
        description: editFormData.description,
        homepage: editFormData.homepage,
        private: editFormData.private,
        has_issues: editFormData.has_issues,
        has_projects: editFormData.has_projects,
        has_wiki: editFormData.has_wiki,
    };

    const result = await updateRepositoryDetails(token, editingRepo.owner.login, editingRepo.name, detailsToUpdate);
    setIsUpdatingRepo(false);

    if (result.success && result.repository) {
      toast.success(`Repository "${result.repository.name}" updated successfully.`);
      // Update the repository in the main list
      setRepositories(prev => prev.map(r => (r.id === result.repository.id ? { ...r, ...result.repository } : r)));
      setIsEditModalOpen(false);
      setEditingRepo(null);
    } else {
      toast.error(`Failed to update repository: ${result.error}`);
    }
  };

  // Initial fetch of repositories
  useEffect(() => {
    fetchRepositories();
  }, [token, sortOption]); 
  
  useEffect(() => {
    // Populate edit form data when editingRepo is set and modal is open
    if (editingRepo && isEditModalOpen) {
        setEditFormData({
            description: editingRepo.description || "",
            homepage: editingRepo.homepage || "",
            private: editingRepo.private,
            has_issues: editingRepo.has_issues === undefined ? true : editingRepo.has_issues,
            has_projects: editingRepo.has_projects === undefined ? true : editingRepo.has_projects,
            has_wiki: editingRepo.has_wiki === undefined ? true : editingRepo.has_wiki,
        });
    }
  }, [editingRepo, isEditModalOpen]);


  // Filtered and sorted repositories
  const filteredRepositories = useMemo(() => {
    return repositories
      .filter(repo => repo.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      .sort((a, b) => {
        const valA = (a as any)[sortOption];
        const valB = (b as any)[sortOption];
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      });
  }, [repositories, debouncedSearchTerm, sortOption]);


  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">GitHub Repository Manager</h1>
        <p className="text-sm text-gray-600">Browse, manage, and interact with your GitHub repositories.</p>
      </header>

      <div className="mb-6 p-4 border rounded-lg shadow bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center flex-grow max-w-md">
            <Search className="mr-2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search repositories (e.g., owner/repo-name)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 flex-grow"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sort by:</Label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger id="sort-select" className="w-[180px] h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_name">Name</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="stargazers_count">Stars</SelectItem>
                <SelectItem value="created_at">Date Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchRepositories} disabled={isLoading} className="h-10">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Refresh List
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-green-600 hover:bg-green-700 h-10">
              <Github className="mr-2 h-4 w-4" /> Create New Repo
            </Button>
            {/* Create Repo Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={(isOpen) => { if (isCreatingRepo) return; setIsCreateModalOpen(isOpen); }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Repository</DialogTitle>
                  <DialogDescription>
                    Enter the details for your new GitHub repository.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-repo-name" className="text-right">Name</Label>
                    <Input id="new-repo-name" value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} className="col-span-3" placeholder="my-awesome-project" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-repo-description" className="text-right">Description</Label>
                    <Input id="new-repo-description" value={newRepoDescription} onChange={(e) => setNewRepoDescription(e.target.value)} className="col-span-3" placeholder="A brief description" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-repo-private" className="text-right col-start-1">Visibility</Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Checkbox id="new-repo-private" name="private" checked={newRepoPrivate} onCheckedChange={(checked) => setNewRepoPrivate(checked as boolean)} />
                        <Label htmlFor="new-repo-private" className="font-normal text-sm">Private Repository</Label>
                      </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreatingRepo}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button onClick={handleCreateRepository} disabled={isCreatingRepo || !newRepoName.trim()}>
                    {isCreatingRepo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />} Create Repository
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* README Modal */}
        <Dialog open={!!editingReadmeRepo} onOpenChange={(isOpen) => { if (isSavingReadme) return; !isOpen && setEditingReadmeRepo(null); } }>
            <DialogContent className="sm:max-w-[70vw] md:max-w-[60vw] lg:max-w-[50vw] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit README.md for {editingReadmeRepo?.full_name}</DialogTitle>
                    <DialogDescription>Make changes to your README.md content below. Click save when you're done.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto">
                    {isReadmeLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                            <p className="ml-4 text-lg">Loading README...</p>
                        </div>
                    ) : readmeContent || readmeEditorContent.startsWith("# No README.md found") ? ( // Allow editing even if no README
                        <Textarea
                            value={readmeEditorContent}
                            onChange={(e) => setReadmeEditorContent(e.target.value)}
                            className="h-full min-h-[400px] font-mono text-sm"
                            placeholder="Start writing your README here..."
                        />
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-lg text-gray-600">Failed to load README content.</p>
                            <Button onClick={() => editingReadmeRepo && handleViewReadme(editingReadmeRepo)} className="mt-4">
                                Try Reloading README
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={() => setEditingReadmeRepo(null)} disabled={isSavingReadme}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={handleSaveReadme} disabled={isSavingReadme || isReadmeLoading}>
                        {isSavingReadme ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save README
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Repository Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if (isUpdatingRepo || isFetchingRepoDetails) return; setIsEditModalOpen(isOpen); if (!isOpen) setEditingRepo(null);}}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Repository: {editingRepo?.full_name}</DialogTitle>
              <DialogDescription>
                Modify the details of your repository. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {isFetchingRepoDetails && !editingRepo?.description ? ( // Show loader if fetching and form data not yet populated from editingRepo
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="ml-3">Loading repository details...</p>
                </div>
            ) : editingRepo ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    className="col-span-3"
                    placeholder="Repository description"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-homepage" className="text-right">
                    Homepage URL
                  </Label>
                  <Input
                    id="edit-homepage"
                    name="homepage"
                    value={editFormData.homepage}
                    onChange={handleEditFormChange}
                    className="col-span-3"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-private" className="text-right">
                    Visibility
                  </Label>
                  <Select
                    name="private"
                    value={editFormData.private.toString()}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, private: value === 'true' }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Private</SelectItem>
                      <SelectItem value="false">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right col-span-1 pt-1">Features</Label>
                    <div className="col-span-3 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="edit-has_issues" name="has_issues" 
                                   checked={editFormData.has_issues} 
                                   onCheckedChange={handleEditFormShadCNCheckboxChange('has_issues')} />
                            <Label htmlFor="edit-has_issues" className="font-normal text-sm">Enable Issues</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="edit-has_projects" name="has_projects"
                                   checked={editFormData.has_projects}
                                   onCheckedChange={handleEditFormShadCNCheckboxChange('has_projects')} />
                            <Label htmlFor="edit-has_projects" className="font-normal text-sm">Enable Projects</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="edit-has_wiki" name="has_wiki"
                                   checked={editFormData.has_wiki}
                                   onCheckedChange={handleEditFormShadCNCheckboxChange('has_wiki')} />
                            <Label htmlFor="edit-has_wiki" className="font-normal text-sm">Enable Wiki</Label>
                        </div>
                    </div>
                </div>
              </div>
            ) : (
                 <div className="flex items-center justify-center py-10 text-gray-500">
                    <p>No repository selected or details could not be loaded.</p>
                 </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {setIsEditModalOpen(false); setEditingRepo(null);}} disabled={isUpdatingRepo || isFetchingRepoDetails}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={isUpdatingRepo || isFetchingRepoDetails || !editingRepo}>
                {isUpdatingRepo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clone Modal */}
        <Dialog open={isCloneModalOpen} onOpenChange={(isOpen) => { if (isCloning) return; setIsCloneModalOpen(isOpen); if(!isOpen) setRepoToClone(null); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clone Repository: {repoToClone?.name}</DialogTitle>
                    <DialogDescription>
                        Specify the local path (on the server where the backend runs) to clone this repository.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clone-url-display" className="text-right">Clone URL</Label>
                        <Input id="clone-url-display" value={repoToClone?.clone_url || ''} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clone-path" className="text-right">Local Path</Label>
                        <Input 
                            id="clone-path" 
                            value={clonePath} 
                            onChange={(e) => setClonePath(e.target.value)} 
                            className="col-span-3" 
                            placeholder="e.g., my-cloned-repos/repo-name" 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {setIsCloneModalOpen(false); setRepoToClone(null);}} disabled={isCloning}>Cancel</Button>
                    <Button onClick={handleCloneConfirm} disabled={isCloning || !clonePath.trim()}>
                        {isCloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
                        Start Clone
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={(isOpen) => { if (isDeleting) return; handleDeleteCancel(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Repository: {repoToDelete?.full_name}</DialogTitle>
                    <DialogDescription>
                        This action <span className="font-bold text-red-600">cannot</span> be undone. This will permanently delete the <span className="font-semibold">{repoToDelete?.full_name}</span> repository, including all its branches, issues, and comments from GitHub.
                        <br /><br />
                        Please type <code className="bg-gray-200 text-red-700 px-1 py-0.5 rounded">{repoToDelete?.name}</code> to confirm.
                    </DialogDescription>
                </DialogHeader>
                <Input 
                    value={deleteRepoNameInput} 
                    onChange={(e) => setDeleteRepoNameInput(e.target.value)}
                    placeholder="Type repository name to confirm"
                    className="my-4 border-red-500 focus:border-red-700"
                />
                <DialogFooter>
                    <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>Cancel</Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleDeleteConfirm} 
                        disabled={isDeleting || deleteRepoNameInput !== repoToDelete?.name}
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Repository
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {isLoading && (
          <div className="flex items-center justify-center my-10">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="ml-4 text-lg">Loading repositories...</p>
          </div>
        )}
        {error && <p className="text-red-500 text-center my-10">{error}</p>}
        {!isLoading && !error && filteredRepositories.length === 0 && (
          <p className="text-center my-10 text-gray-600">
            No repositories found. {searchTerm ? "Try a different search term." : "Create or fetch some repositories!"}
          </p>
        )}
        {!isLoading && !error && filteredRepositories.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Visibility</TableHead>
                <TableHead className="text-center">Stars</TableHead>
                <TableHead className="text-center">Forks</TableHead>
                <TableHead className="text-center">Issues</TableHead> 
                <TableHead className="text-center">Language</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepositories.map(repo => (
                <TableRow key={repo.id}>
                  <TableCell className="font-medium">
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 flex items-center">
                      {repo.full_name} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="mt-1 space-x-1">
                        {repo.topics.slice(0, 3).map(topic => ( 
                          <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">{repo.description || "No description"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={repo.private ? "destructive" : "outline"} className="text-xs">
                      {repo.private ? "Private" : "Public"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Star className="inline mr-1 h-4 w-4 text-yellow-500" /> {repo.stargazers_count}
                  </TableCell>
                  <TableCell className="text-center">
                    <GitFork className="inline mr-1 h-4 w-4 text-blue-500" /> {repo.forks_count}
                  </TableCell>
                  <TableCell className="text-center">
                     <Triangle className="inline mr-1 h-4 w-4 text-green-500" /> {repo.open_issues_count !== undefined ? repo.open_issues_count : repo.watchers_count}
                  </TableCell>
                  <TableCell className="text-center text-xs">{repo.language || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewReadme(repo)} title="View/Edit README">
                      {isReadmeLoading && editingReadmeRepo?.id === repo.id && readmeContent === null ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <BookOpen className="mr-1 h-4 w-4" />} Readme
                    </Button>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenEditModal(repo)} title="Edit Repository Details">
                      {isFetchingRepoDetails && editingRepo?.id === repo.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Pencil className="mr-1 h-4 w-4" />} Edit
                    </Button>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenCloneModal(repo)} title="Clone Repository">
                      <Github className="mr-1 h-4 w-4" /> Clone
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDeleteModal(repo)} className="text-red-500 hover:text-red-700" title="Delete Repository">
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export { RepoManager };
export default RepoManager;
