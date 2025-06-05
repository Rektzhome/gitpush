"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PlusCircle, Trash2, Loader2, RefreshCw, XCircle, Save } from 'lucide-react';
import { getRepositoryBranches, createBranch, deleteBranch } from '@/app/actions'; // Assuming getRepositoryBranches exists

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface BranchManagerProps {
  token: string;
  username: string;
  repoName: string;
  onBranchSelect?: (branchName: string) => void;
}

export default function BranchManager({ token, username, repoName, onBranchSelect }: BranchManagerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isDeletingBranch, setIsDeletingBranch] = useState<string | null>(null);
  
  const [newBranchName, setNewBranchName] = useState('');
  const [baseBranchName, setBaseBranchName] = useState('');
  const [defaultBaseBranch, setDefaultBaseBranch] = useState('');
  
  const [showCreateBranchForm, setShowCreateBranchForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean, branchName: string | null }>({ open: false, branchName: null });

  const fetchBranches = useCallback(async () => {
    if (!repoName || !username) {
        setBranches([]);
        return;
    }
    setIsLoadingBranches(true);
    try {
      const result = await getRepositoryBranches(token, username, repoName);
      if (result.success && result.branches) {
        setBranches(result.branches);
        // Determine default base branch (e.g., main, master, or first branch)
        const mainBranch = result.branches.find((b: Branch) => b.name === 'main');
        const masterBranch = result.branches.find((b: Branch) => b.name === 'master');
        const determinedDefault = mainBranch?.name || masterBranch?.name || result.branches[0]?.name || '';
        setDefaultBaseBranch(determinedDefault);
        if (!baseBranchName && determinedDefault) { // Set baseBranchName if not already set or form is not open
            setBaseBranchName(determinedDefault);
        }
      } else {
        toast.error(result.error || "Failed to fetch branches.");
        setBranches([]);
      }
    } catch (error) {
      toast.error("An unexpected error occurred while fetching branches.");
      setBranches([]);
    } finally {
      setIsLoadingBranches(false);
    }
  }, [token, username, repoName, baseBranchName]); // Added baseBranchName to dependencies of useCallback

  useEffect(() => {
    fetchBranches();
  }, [repoName, fetchBranches]); // fetchBranches is now memoized

  const handleCreateBranchToggle = () => {
    setShowCreateBranchForm(!showCreateBranchForm);
    if (!showCreateBranchForm) {
        // When opening the form, set baseBranch to default
        setBaseBranchName(defaultBaseBranch);
        setNewBranchName(''); // Clear new branch name
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast.error("New branch name cannot be empty.");
      return;
    }
    if (!baseBranchName) {
      toast.error("Base branch must be selected.");
      return;
    }
    setIsCreatingBranch(true);
    toast.info(`Creating branch "${newBranchName}" from "${baseBranchName}"...`);
    try {
      const result = await createBranch(token, username, repoName, newBranchName, baseBranchName);
      if (result.success) {
        toast.success(`Branch "${newBranchName}" created successfully.`);
        fetchBranches(); // Refresh list
        setNewBranchName('');
        // setBaseBranchName(defaultBaseBranch); // Reset base branch to default for next creation
        setShowCreateBranchForm(false);
      } else {
        toast.error(result.error || "Failed to create branch.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while creating the branch.");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const openDeleteConfirm = (branchName: string) => {
    // Basic check to prevent deleting common default branches easily.
    // A more robust solution would fetch the repo's actual default branch.
    if (branchName === 'main' || branchName === 'master' || branchName === defaultBaseBranch) {
        if(branches.length <=1){
             toast.error(`Cannot delete the only branch of the repository.`);
             return;
        }
      // toast.warn(`Are you sure you want to delete the default branch "${branchName}"? This is generally not recommended.`);
      // Allow deletion but with a warning or make it harder. For now, proceed to confirm.
    }
     if (branches.length <= 1 && (branchName === 'main' || branchName === 'master' || branchName === defaultBaseBranch)) {
        toast.error("Cannot delete the only branch or the default branch if it's the last one.");
        return;
    }
    setShowDeleteConfirm({ open: true, branchName });
  };

  const confirmDeleteBranch = async () => {
    if (!showDeleteConfirm.branchName) return;
    
    setIsDeletingBranch(showDeleteConfirm.branchName);
    toast.info(`Deleting branch "${showDeleteConfirm.branchName}"...`);
    try {
      const result = await deleteBranch(token, username, repoName, showDeleteConfirm.branchName);
      if (result.success) {
        toast.success(`Branch "${showDeleteConfirm.branchName}" deleted successfully.`);
        fetchBranches(); // Refresh list
        if (baseBranchName === showDeleteConfirm.branchName) { // If deleted branch was selected as base, reset
            setBaseBranchName(defaultBaseBranch);
        }
      } else {
        toast.error(result.error || `Failed to delete branch "${showDeleteConfirm.branchName}".`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting the branch.");
    } finally {
      setIsDeletingBranch(null);
      setShowDeleteConfirm({ open: false, branchName: null });
    }
  };

  if (!repoName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please select a repository to manage its branches.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Branches for {repoName}</CardTitle>
            <CardDescription>Manage branches for the selected repository.</CardDescription>
        </div>
        <div className="flex gap-2">
            <Button onClick={fetchBranches} variant="outline" size="sm" disabled={isLoadingBranches || isCreatingBranch || !!isDeletingBranch}>
                {isLoadingBranches ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
            </Button>
            <Button onClick={handleCreateBranchToggle} variant="default" size="sm" disabled={isLoadingBranches || isCreatingBranch || !!isDeletingBranch}>
                <PlusCircle className="mr-2 h-4 w-4" /> {showCreateBranchForm ? 'Cancel' : 'New Branch'}
            </Button>
        </div>
      </CardHeader>
      
      {showCreateBranchForm && (
        <CardContent className="border-t pt-4">
          <CardTitle className="text-lg mb-2">Create New Branch</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="newBranchName">New Branch Name</Label>
              <Input 
                id="newBranchName" 
                value={newBranchName} 
                onChange={(e) => setNewBranchName(e.target.value)} 
                placeholder="e.g., feature/new-design" 
                disabled={isCreatingBranch}
              />
            </div>
            <div>
              <Label htmlFor="baseBranchName">Base Branch</Label>
              <Select 
                value={baseBranchName} 
                onValueChange={setBaseBranchName}
                disabled={isCreatingBranch || branches.length === 0}
              >
                <SelectTrigger id="baseBranchName">
                  <SelectValue placeholder="Select base branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateBranch} disabled={isCreatingBranch || !newBranchName.trim() || !baseBranchName}>
              {isCreatingBranch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Create Branch
            </Button>
          </div>
        </CardContent>
      )}

      <CardContent className="pt-4">
        {isLoadingBranches ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-3">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No branches found for this repository.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Last Commit SHA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.name}>
                  <TableCell className="font-medium">
                    <span onClick={() => onBranchSelect?.(branch.name)} className={onBranchSelect ? "cursor-pointer hover:underline" : ""}>
                        {branch.name}
                        {branch.name === defaultBaseBranch && <span className="ml-2 text-xs text-muted-foreground">(default)</span>}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{branch.commit.sha}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openDeleteConfirm(branch.name)}
                      disabled={!!isDeletingBranch || (branches.length <= 1 && branch.name === defaultBaseBranch)}
                      className="text-red-500 hover:text-red-700"
                      title={`Delete branch ${branch.name}`}
                    >
                      {isDeletingBranch === branch.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={showDeleteConfirm.open} onOpenChange={(open) => setShowDeleteConfirm({open, branchName: open ? showDeleteConfirm.branchName : null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the branch 
              <span className="font-semibold"> {showDeleteConfirm.branchName}</span> from the repository <span className="font-semibold">{repoName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeletingBranch}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDeleteBranch}
              disabled={!!isDeletingBranch}
            >
              {isDeletingBranch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Branch
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
