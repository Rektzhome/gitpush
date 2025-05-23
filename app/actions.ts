"use server"

import { Octokit } from "@octokit/rest"
import { Base64 } from "js-base64"

const readmeCache = new Map()

// Validate GitHub token by attempting to get user data
export async function validateGitHubToken(token: string) {
  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.users.getAuthenticated()
    return { valid: true, user: data }
  } catch (error) {
    return { valid: false, error: "Invalid GitHub token" }
  }
}

// --- License Management Functions ---

export async function getLicenseContent(
  token: string,
  owner: string,
  repo: string,
  branch?: string, // If not provided, Octokit defaults to the repo's default branch
  path: string = "LICENSE"
): Promise<{ success: boolean; content?: string | null; sha?: string | null; error?: string }> {
  if (!token) return { success: false, error: "GitHub token is required." };
  if (!owner || !repo) return { success: false, error: "Owner and repository name are required." };

  const octokit = new Octokit({ auth: token });

  try {
    const params: any = { owner, repo, path };
    if (branch) params.ref = branch;

    const { data } = await octokit.repos.getContent(params);

    // Ensure data is a file object (not an array if path is a directory)
    if (Array.isArray(data) || data.type !== "file" || typeof data.content !== 'string') {
      return { success: false, error: `Path '${path}' is not a file or content is missing.` };
    }
    
    const decodedContent = Base64.decode(data.content);
    return { success: true, content: decodedContent, sha: data.sha };

  } catch (error: any) {
    if (error.status === 404) {
      // File not found, this is not necessarily an error in the context of checking for a license
      return { success: true, content: null, sha: null }; 
    }
    console.error(`Error fetching license content for ${owner}/${repo}/${path}:`, error);
    return { success: false, error: error.response?.data?.message || error.message || "Failed to fetch license content." };
  }
}

export async function updateLicenseFile(
  token: string,
  owner: string,
  repo: string,
  content: string,
  branch: string,
  sha?: string | null, // SHA of the file if it exists, null/undefined if creating a new file
  path: string = "LICENSE"
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!token) return { success: false, error: "GitHub token is required." };
  if (!owner || !repo || !branch) return { success: false, error: "Owner, repository name, and branch are required." };
  if (content === undefined || content === null) return { success: false, error: "License content is required."};

  const octokit = new Octokit({ auth: token });
  const encodedContent = Base64.encode(content);
  const message = sha ? `Update ${path}` : `Create ${path}`;

  try {
    const params: any = {
      owner,
      repo,
      path,
      message,
      content: encodedContent,
      branch,
    };
    if (sha) {
      params.sha = sha;
    }

    const { data } = await octokit.repos.createOrUpdateFileContents(params);
    return { success: true, data };
  } catch (error: any) {
    console.error(`Error updating license file for ${owner}/${repo}/${path}:`, error);
    return { success: false, error: error.response?.data?.message || error.message || `Failed to ${sha ? 'update' : 'create'} license file.` };
  }
}

export async function getGithubLicenseTemplates(
  token: string
): Promise<{ success: boolean; templates?: any[]; error?: string }> {
  if (!token) return { success: false, error: "GitHub token is required." };
  const octokit = new Octokit({ auth: token });

  try {
    // octokit.licenses.listCommonlyUsed() is one option for a curated list.
    // For a more comprehensive list, use the general licenses endpoint.
    const { data } = await octokit.request("GET /licenses", {
        headers: {
            "X-GitHub-Api-Version": "2022-11-28",
        },
        // per_page: 100 // if pagination is needed
    });
    return { success: true, templates: data };
  } catch (error: any) {
    console.error("Error fetching GitHub license templates:", error);
    return { success: false, error: error.response?.data?.message || error.message || "Failed to fetch license templates." };
  }
}

export async function getGithubLicenseTemplateContent(
  token: string,
  licenseKey: string
): Promise<{ success: boolean; template?: any; error?: string }> {
  if (!token) return { success: false, error: "GitHub token is required." };
  if (!licenseKey) return { success: false, error: "License key is required."};
  
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.licenses.get({
      license: licenseKey,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return { success: true, template: data };
  } catch (error: any) {
    console.error(`Error fetching content for license template '${licenseKey}':`, error);
     if (error.status === 404) {
      return { success: false, error: `License template '${licenseKey}' not found.` };
    }
    return { success: false, error: error.response?.data?.message || error.message || "Failed to fetch license template content." };
  }
}

export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  newBranchName: string,
  baseBranchName: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!token) {
    return { success: false, error: "GitHub token is required." };
  }
  if (!owner || !repo || !newBranchName || !baseBranchName) {
    return { success: false, error: "Owner, repo, new branch name, and base branch name are required." };
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 1. Get the SHA of the base branch's head commit
    const { data: baseBranchRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranchName}`, // Ensure to specify 'heads/' not 'refs/heads/' for getRef shorthand
    });

    const baseSha = baseBranchRef.object.sha;

    // 2. Create the new branch using the base SHA
    const { data: newBranchResponse } = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranchName}`, // createRef requires the full ref path
      sha: baseSha,
    });

    return { success: true, data: newBranchResponse };
  } catch (error: any) {
    console.error("Error creating branch:", error);
    // Provide more specific error messages if possible
    if (error.status === 422 && error.message?.includes("Reference already exists")) {
        return { success: false, error: `Branch '${newBranchName}' already exists.` };
    }
    if (error.status === 404 && error.message?.includes("Reference not found")) {
        return { success: false, error: `Base branch '${baseBranchName}' not found.` };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to create branch.",
    };
  }
}

export async function deleteBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: "GitHub token is required." };
  }
  if (!owner || !repo || !branchName) {
    return { success: false, error: "Owner, repo, and branch name are required." };
  }
  // Prevent deleting common default branches accidentally through this generic function
  // More sophisticated checks might involve fetching the default branch of the repo
  if (branchName === "main" || branchName === "master" || branchName === "dev" || branchName === "develop") {
    // Consider fetching the default branch name from repo details for a more robust check
    // For now, simple check:
     // return { success: false, error: `Deleting default branches ('${branchName}') is restricted through this function.` };
     // Allowing it for now as per instructions, but in a real app, this would be a good safeguard.
  }


  const octokit = new Octokit({ auth: token });

  try {
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`, // deleteRef also uses 'heads/' not 'refs/heads/' in its parameter
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting branch:", error);
    if (error.status === 422 && error.message?.includes("Reference does not exist")) {
        return { success: false, error: `Branch '${branchName}' not found or already deleted.`};
    }
     if (error.status === 422 && error.message?.includes("protected branch")) {
        return { success: false, error: `Branch '${branchName}' is protected and cannot be deleted through the API.`};
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to delete branch.",
    };
  }
}

// Get user repositories
export async function getUserRepositories(token: string, page = 1, perPage = 10) {
  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: perPage,
      page: page,
    })
    return { success: true, repositories: data }
  } catch (error) {
    return { success: false, error: "Failed to fetch repositories" }
  }
}

// Create a new repository
export async function createRepository(
  token: string,
  name: string,
  description: string,
  isPrivate: boolean,
  initReadme: boolean,
) {
  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: initReadme,
    })
    return { success: true, repository: data }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create repository",
    }
  }
}

// Delete a repository
export async function deleteRepository(token: string, owner: string, repo: string) {
  try {
    const octokit = new Octokit({ auth: token })
    await octokit.repos.delete({
      owner,
      repo,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete repository" }
  }
}

// Get repository branches
export async function getRepositoryBranches(token: string, owner: string, repo: string) {
  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
    })
    return { success: true, branches: data }
  } catch (error) {
    return { success: false, error: "Failed to fetch branches" }
  }
}

// Upload a file to a repository
export async function uploadFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
) {
  try {
    const octokit = new Octokit({ auth: token })

    // Check if file exists to determine if we need to create or update
    let sha
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      })

      if (!Array.isArray(data)) {
        sha = data.sha
      }
    } catch (error) {
      // File doesn't exist, which is fine for creation
    }

    // Create or update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Base64.encode(content),
      branch,
      sha,
    })

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to upload file",
    }
  }
}

// Get README content
export async function getReadmeContent(token: string, owner: string, repo: string, branch = "main") {
  const cacheKey = `${owner}/${repo}/${branch}`

  // Check if we have a cached version
  if (readmeCache.has(cacheKey)) {
    return readmeCache.get(cacheKey)
  }

  try {
    const octokit = new Octokit({ auth: token })

    try {
      const { data } = await octokit.repos.getReadme({
        owner,
        repo,
        ref: branch,
      })

      const content = Base64.decode(data.content)
      const result = { success: true, content, sha: data.sha }

      // Cache the result
      readmeCache.set(cacheKey, result)

      return result
    } catch (error) {
      // README doesn't exist
      const result = { success: true, content: "", sha: null }
      readmeCache.set(cacheKey, result)
      return result
    }
  } catch (error) {
    return { success: false, error: "Failed to fetch README" }
  }
}

interface UpdateRepoDetails {
  description?: string;
  homepage?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
}

export async function updateRepositoryDetails(
  token: string,
  owner: string,
  repo: string,
  details: UpdateRepoDetails
): Promise<{ success: boolean; repository?: any; error?: string }> {
  if (!token) {
    return { success: false, error: "GitHub token is required." };
  }
  if (!owner || !repo) {
    return { success: false, error: "Owner and repository name are required." };
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Construct the payload by only including fields that are actually provided in 'details'
    const payload: { [key: string]: any } = {};
    if (details.description !== undefined) payload.description = details.description;
    if (details.homepage !== undefined) payload.homepage = details.homepage;
    if (details.private !== undefined) payload.private = details.private;
    if (details.has_issues !== undefined) payload.has_issues = details.has_issues;
    if (details.has_projects !== undefined) payload.has_projects = details.has_projects;
    if (details.has_wiki !== undefined) payload.has_wiki = details.has_wiki;
    // Add other updatable fields here as needed, e.g., allow_merge_commit, allow_squash_merge, etc.


    // If no actual details to update are provided, perhaps return early or throw an error,
    // though the GitHub API might just return the current state without changes.
    // For now, let's proceed even if payload is empty. GitHub will handle it.
    // if (Object.keys(payload).length === 0) {
    //   return { success: false, error: "No details provided for update." };
    // }

    const { data } = await octokit.request("PATCH /repos/{owner}/{repo}", {
      owner,
      repo,
      ...payload, // Spread the filtered details
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return { success: true, repository: data };
  } catch (error: any) {
    console.error("Error updating repository details:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to update repository.",
    };
  }
}

export async function getRepositoryDetails(
  token: string,
  owner: string,
  repo: string
): Promise<{ success: boolean; repository?: any; error?: string }> {
  if (!token) {
    return { success: false, error: "GitHub token is required." };
  }
  if (!owner || !repo) {
    return { success: false, error: "Owner and repository name are required." };
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return { success: true, repository: data };
  } catch (error: any) {
    console.error("Error fetching repository details:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch repository details.",
    };
  }
}

// Update README content
export async function updateReadme(
  token: string,
  owner: string,
  repo: string,
  content: string,
  branch = "main",
  sha: string | null = null,
) {
  try {
    const octokit = new Octokit({ auth: token })

    const message = sha ? "Update README.md" : "Create README.md"
    const path = "README.md"

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Base64.encode(content),
      branch,
      sha,
    })

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update README",
    }
  }
}
