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
