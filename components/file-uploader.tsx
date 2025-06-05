"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileUp, Upload, Loader2, Archive } from "lucide-react"
import { getUserRepositories, getRepositoryBranches, uploadFile } from "@/app/actions"
import { Progress } from "@/components/ui/progress"
import JSZip from "jszip"

interface FileUploaderProps {
  token: string
  username: string
}

export function FileUploader({ token, username }: FileUploaderProps) {
  console.log("FileUploader props:", { token: !!token, username })
  
  // Debug: Check if username is available
  useEffect(() => {
    if (!username) {
      console.error("Username is missing in FileUploader!")
    }
  }, [username])
  
  const [files, setFiles] = useState<FileList | null>(null)
  const [repository, setRepository] = useState("")
  const [branch, setBranch] = useState("")
  const [path, setPath] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [repositories, setRepositories] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!token) return

      setIsLoadingRepos(true)
      try {
        const result = await getUserRepositories(token)
        if (result.success) {
          setRepositories(result.repositories || [])
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
      console.log("fetchBranches called with:", { token: !!token, repository, username })
      
      if (!repository) {
        // Reset branches jika tidak ada repository yang dipilih
        setBranches([]);
        setBranch("");
        setIsLoadingBranches(false);
        return;
      }

      setIsLoadingBranches(true)
      setBranch("")
      
      // Selalu sediakan branch default (main dan master)
      const defaultBranches = [
        { name: "main" },
        { name: "master" }
      ];
      
      // Jika tidak ada token atau username, gunakan branch default
      if (!token || !username) {
        console.log("Missing token or username, using default branches")
        setBranches(defaultBranches);
        setBranch("main");
        setIsLoadingBranches(false);
        return;
      }
      
      try {
        console.log("Calling getRepositoryBranches with:", { token: !!token, username, repository })
        const result = await getRepositoryBranches(token, username, repository)
        console.log("getRepositoryBranches result:", result)
        if (result.success && result.branches && result.branches.length > 0) {
          // Gabungkan branch dari API dengan default branches jika belum ada
          const existingBranchNames = result.branches.map((b: any) => b.name);
          const additionalBranches = defaultBranches.filter(b => !existingBranchNames.includes(b.name));
          const allBranches = [...result.branches, ...additionalBranches];
          
          setBranches(allBranches);
          
          // Set default branch
          const defaultBranch =
            allBranches.find((b: any) => b.name === "main" || b.name === "master") || allBranches[0];
          setBranch(defaultBranch.name);
        } else {
          // Jika API gagal, gunakan branch default
          setBranches(defaultBranches);
          setBranch("main"); // Default ke main
        }
      } catch (error) {
        // Jika API error, gunakan branch default
        setBranches(defaultBranches);
        setBranch("main");
        console.error("Error fetching branches:", error);
        toast({
          title: "Warning",
          description: "Using default branches (main/master)",
          variant: "default",
        })
      } finally {
        setIsLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [token, repository, username, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
    }
  }

  // Fungsi untuk membaca file sebagai text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // Fungsi untuk membaca file sebagai ArrayBuffer (untuk file zip)
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // Fungsi untuk mengekstrak file zip
  const extractZipFile = async (file: File): Promise<Array<{name: string, content: string}>> => {
    try {
      const content = await readFileAsArrayBuffer(file)
      const zip = new JSZip()
      const zipContents = await zip.loadAsync(content)
      
      const extractedFiles: Array<{name: string, content: string}> = []
      
      // Proses semua file dalam zip
      const filePromises = Object.keys(zipContents.files).map(async (filename) => {
        const zipEntry = zipContents.files[filename]
        
        // Skip direktori
        if (zipEntry.dir) return
        
        // Skip file tersembunyi
        if (filename.startsWith('.') || filename.includes('/__MACOSX/')) return
        
        try {
          const content = await zipEntry.async('string')
          extractedFiles.push({
            name: filename,
            content: content
          })
        } catch (error) {
          console.error(`Failed to extract ${filename}:`, error)
        }
      })
      
      await Promise.all(filePromises)
      return extractedFiles
    } catch (error) {
      console.error('Error extracting zip:', error)
      throw new Error('Failed to extract zip file')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      })
      return
    }

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

    setIsUploading(true)
    setUploadProgress(0)
    setCurrentFileIndex(0)
    
    try {
      const fileArray = Array.from(files)
      let filesToUpload: Array<{name: string, content: string, originalFile: File}> = []
      let zipFilesCount = 0
      
      // Pertama, proses semua file dan ekstrak file zip
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        
        // Cek apakah file adalah zip
        if (file.name.toLowerCase().endsWith('.zip')) {
          zipFilesCount++
          toast({
            title: "Extracting zip",
            description: `Extracting ${file.name}...`,
          })
          
          try {
            // Ekstrak file zip
            const extractedFiles = await extractZipFile(file)
            
            // Tambahkan file hasil ekstrak ke daftar upload
            extractedFiles.forEach(extractedFile => {
              filesToUpload.push({
                name: extractedFile.name,
                content: extractedFile.content,
                originalFile: file
              })
            })
            
            toast({
              title: "Extraction complete",
              description: `Extracted ${extractedFiles.length} files from ${file.name}`,
            })
          } catch (error) {
            toast({
              title: "Extraction failed",
              description: `Failed to extract ${file.name}`,
              variant: "destructive",
            })
          }
        } else {
          // File biasa, tambahkan ke daftar upload
          const content = await readFileAsText(file)
          filesToUpload.push({
            name: file.name,
            content: content,
            originalFile: file
          })
        }
      }
      
      // Update total files untuk progress bar
      setTotalFiles(filesToUpload.length)
      
      // Upload semua file
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < filesToUpload.length; i++) {
        setCurrentFileIndex(i + 1)
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100))
        
        const fileToUpload = filesToUpload[i]
        const isFromZip = fileToUpload.originalFile.name.toLowerCase().endsWith('.zip')
        
        // Tentukan path file
        let filePath
        if (isFromZip) {
          // Untuk file dari zip, gunakan struktur folder dalam zip
          filePath = path ? `${path}/${fileToUpload.name}` : fileToUpload.name
        } else {
          // Untuk file biasa, gunakan nama file
          filePath = path ? `${path}/${fileToUpload.name}` : fileToUpload.name
        }
        
        // Upload file
        const result = await uploadFile(
          token, 
          username, 
          repository, 
          filePath, 
          fileToUpload.content, 
          `Upload ${isFromZip ? '(from zip) ' : ''}${fileToUpload.name}`, 
          branch
        )
        
        if (result.success) {
          successCount++
        } else {
          failCount++
          console.error(`Failed to upload ${fileToUpload.name}:`, result.error)
        }
      }
      
      // Tampilkan hasil upload
      if (failCount === 0) {
        toast({
          title: "Upload complete",
          description: zipFilesCount > 0 
            ? `Successfully uploaded ${successCount} files (including extracted zip contents)`
            : `Successfully uploaded ${successCount} files`,
        })
      } else {
        toast({
          title: "Upload partially complete",
          description: `Uploaded ${successCount} files, ${failCount} failed`,
          variant: "destructive",
        })
      }
      
      // Reset form
      setFiles(null)
      setPath("")
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          File Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repository">Repository</Label>
            <div className="relative">
              {isLoadingRepos && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              <Select value={repository} onValueChange={setRepository} disabled={isLoadingRepos}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingRepos ? "Loading repositories..." : "Select repository"} />
                </SelectTrigger>
                <SelectContent>
                  {repositories.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No repositories found</div>
                  ) : (
                    repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.name}>
                        {repo.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="path">Path (optional)</Label>
            <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="e.g., docs/images" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Files</Label>
            <div className="flex items-center gap-4">
              <Input id="file-upload" type="file" multiple onChange={handleFileChange} className="hidden" />
              <div className="grid w-full gap-2">
                <Label
                  htmlFor="file-upload"
                  className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-5 text-center transition-colors hover:bg-gray-100"
                >
                  <FileUp className="h-6 w-6 text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    {files && files.length > 0
                      ? `${files.length} file(s) selected`
                      : "Drag and drop files here or click to browse"}
                  </div>
                  <div className="mt-1 text-xs text-blue-600">
                    ZIP files will be automatically extracted
                  </div>
                </Label>
                {files && files.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {Array.from(files)
                      .slice(0, 3)
                      .map((file, index) => (
                        <div key={index} className="truncate flex items-center gap-1">
                          {file.name.toLowerCase().endsWith('.zip') && (
                            <Archive className="h-3 w-3 text-blue-500" />
                          )}
                          {file.name}
                          {file.name.toLowerCase().endsWith('.zip') && (
                            <span className="text-xs text-blue-500">(will be extracted)</span>
                          )}
                        </div>
                      ))}
                    {files.length > 3 && <div>{`and ${files.length - 3} more file(s)`}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2 bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between text-sm">
                <span>
                  Uploading file {currentFileIndex} of {totalFiles}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">Please don't close this window during upload</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={isUploading || !repository || !branch || !files}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Files
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
