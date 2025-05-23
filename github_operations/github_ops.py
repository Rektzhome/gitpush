import os
import git
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def clone_repository(repo_url: str, local_path: str, github_token: str) -> tuple[bool, str | None]:
    """
    Clones a repository from repo_url to local_path.
    Uses github_token for authentication if the repository is private.
    Returns True if successful, False otherwise, along with an error message if any.
    """
    try:
        if not github_token:
            logging.error("GitHub token is required for cloning.")
            return False, "GitHub token is required."

        # Construct the authenticated URL
        # Assuming repo_url is like https://github.com/user/repo.git
        if "://" in repo_url:
            protocol, rest_of_url = repo_url.split("://", 1)
            authenticated_url = f"{protocol}://{github_token}@{rest_of_url}"
        else:
            # Fallback or error if URL format is unexpected
            logging.error(f"Unexpected repo_url format: {repo_url}")
            return False, f"Unexpected repo_url format: {repo_url}"

        if os.path.exists(local_path):
            if os.listdir(local_path): # Check if directory is not empty
                logging.warning(f"Local path '{local_path}' already exists and is not empty. Cloning aborted.")
                return False, f"Local path '{local_path}' already exists and is not empty."
            else:
                logging.info(f"Local path '{local_path}' exists but is empty. Proceeding with clone.")
        else:
            os.makedirs(local_path)
            logging.info(f"Created local directory '{local_path}'.")

        logging.info(f"Cloning repository from {repo_url} to {local_path}...")
        git.Repo.clone_from(authenticated_url, local_path)
        logging.info(f"Repository cloned successfully to {local_path}.")
        return True, None
    except git.GitCommandError as e:
        logging.error(f"Git command error during clone: {e}")
        return False, str(e)
    except Exception as e:
        logging.error(f"An unexpected error occurred during clone: {e}")
        return False, str(e)

if __name__ == '__main__':
    # Example usage (replace with your actual details and ensure the token has repo scope)
    # Note: For security, avoid hardcoding tokens. Use environment variables or a config file.
    # This is a placeholder token and will not work.
    test_token = "YOUR_GITHUB_TOKEN" # Replace with a real token for testing
    
    # Test clone_repository
    # Create a dummy public repo on GitHub for testing this, or use an existing one.
    # Make sure the local_path_clone directory does not exist or is empty before running.
    # repo_to_clone = "https://github.com/someuser/somerepo.git" # Replace with a real repo URL
    # local_clone_path = "temp_cloned_repo"

    # print("\n--- Testing clone_repository ---")
    # if test_token == "YOUR_GITHUB_TOKEN":
    #     print("Please replace YOUR_GITHUB_TOKEN with a real token to test cloning.")
    # else:
    #     # Cleanup before test
    #     if os.path.exists(local_clone_path):
    #         import shutil
    #         shutil.rmtree(local_clone_path)
    #         print(f"Cleaned up existing directory: {local_clone_path}")

    #     success, message = clone_repository(repo_to_clone, local_clone_path, test_token)
    #     if success:
    #         print(f"Cloning successful: {local_clone_path}")
    #     else:
    #         print(f"Cloning failed: {message}")
    # pass # Placeholder for further function implementations and tests


def push_repository(local_path: str, remote_name: str = "origin", branch_name: str = "main", github_token: str = None) -> tuple[bool, str | None]:
    """
    Pushes changes from local_path to the remote_name on branch_name.
    Uses github_token for authentication.
    Returns True if successful, False otherwise, along with an error message if any.
    """
    try:
        if not github_token:
            logging.error("GitHub token is required for pushing.")
            return False, "GitHub token is required."

        repo = git.Repo(local_path)
        
        # Get the remote
        try:
            remote = repo.remote(name=remote_name)
        except git.GitCommandError:
            logging.error(f"Remote '{remote_name}' does not exist in {local_path}.")
            return False, f"Remote '{remote_name}' does not exist."

        # Update remote URL to include the token for authentication
        # Assumes remote.url is like https://github.com/user/repo.git
        remote_url_parts = remote.url.split("://")
        if len(remote_url_parts) != 2:
            logging.error(f"Unexpected remote URL format: {remote.url}")
            return False, f"Unexpected remote URL format: {remote.url}"
        
        protocol, rest_of_url = remote_url_parts
        # Ensure we don't duplicate the token if it's already there (e.g. from clone)
        if "@" in rest_of_url:
            rest_of_url = rest_of_url.split("@",1)[1]

        authenticated_url = f"{protocol}://{github_token}@{rest_of_url}"
        remote.set_url(authenticated_url, old_url=remote.url) # Update the URL

        logging.info(f"Pushing changes from {local_path} to remote '{remote_name}' branch '{branch_name}'...")
        push_info = remote.push(refspec=f"{branch_name}:{branch_name}")

        if push_info:
            pi = push_info[0] # Assuming one refspec
            if pi.flags & git.PushInfo.ERROR:
                logging.error(f"Error during push: {pi.summary}")
                return False, f"Push failed: {pi.summary}"
            elif pi.flags & git.PushInfo.REJECTED:
                logging.warning(f"Push rejected: {pi.summary}")
                return False, f"Push rejected: {pi.summary}"
            elif pi.flags & git.PushInfo.UP_TO_DATE:
                logging.info(f"Branch '{branch_name}' is already up to date on remote '{remote_name}'.")
                return True, f"Branch '{branch_name}' is already up to date." # Or False depending on desired behavior
            else:
                logging.info(f"Push successful to remote '{remote_name}' branch '{branch_name}'. Summary: {pi.summary}")
                return True, None
        else:
            # This case might not be hit if push always returns PushInfo,
            # but good to have as a fallback.
            logging.warning("Push command did not return any info, assuming it might have failed or nothing to push.")
            # Check if branch is up-to-date as a common scenario for empty push_info
            # This is a heuristic, actual git status might be more complex
            if repo.head.commit == remote.fetch()[0].commit:
                 logging.info(f"Branch '{branch_name}' is already up to date on remote '{remote_name}'.")
                 return True, f"Branch '{branch_name}' is already up to date."
            return False, "Push command returned no information."

    except git.InvalidGitRepositoryError:
        logging.error(f"Invalid git repository at {local_path}.")
        return False, f"Invalid git repository at {local_path}."
    except git.GitCommandError as e:
        logging.error(f"Git command error during push: {e}")
        # Attempt to restore original remote URL on error
        try:
            repo = git.Repo(local_path)
            remote = repo.remote(name=remote_name)
            original_url = remote.url.replace(f"{github_token}@", "") # simple attempt to remove token
            remote.set_url(original_url, old_url=remote.url)
        except Exception as ex:
            logging.warning(f"Could not restore original remote URL after push error: {ex}")
        return False, str(e)
    except Exception as e:
        logging.error(f"An unexpected error occurred during push: {e}")
        return False, str(e)

if __name__ == '__main__':
    # Example usage (replace with your actual details and ensure the token has repo scope)
    # Note: For security, avoid hardcoding tokens. Use environment variables or a config file.
    # This is a placeholder token and will not work.
    test_token = os.getenv("GITHUB_TOKEN", "YOUR_GITHUB_TOKEN") # Replace with a real token for testing
    
    # Test clone_repository
    # Create a dummy public repo on GitHub for testing this, or use an existing one.
    # Make sure the local_path_clone directory does not exist or is empty before running.
    repo_to_clone = "https://github.com/git-fixtures/basic.git" # A public test repo
    local_clone_path = "temp_cloned_repo_for_push_test"

    print("\n--- Testing clone_repository (for push test setup) ---")
    if test_token == "YOUR_GITHUB_TOKEN":
        print("Please replace YOUR_GITHUB_TOKEN with a real token or set GITHUB_TOKEN env var to test.")
    else:
        # Cleanup before test
        if os.path.exists(local_clone_path):
            import shutil
            shutil.rmtree(local_clone_path)
            print(f"Cleaned up existing directory: {local_clone_path}")

        clone_success, clone_message = clone_repository(repo_to_clone, local_clone_path, test_token)
        if clone_success:
            print(f"Cloning successful: {local_clone_path}")

            # Create a dummy commit to test push
            try:
                with open(os.path.join(local_clone_path, "test_push_file.txt"), "w") as f:
                    f.write("This is a test file for pushing.\n")
                repo = git.Repo(local_clone_path)
                repo.index.add(["test_push_file.txt"])
                repo.index.commit("Test commit for push operation")
                print("Created a dummy commit.")
            except Exception as e:
                print(f"Failed to create dummy commit: {e}")
                clone_success = False # Mark as failed if commit creation fails

            if clone_success:
                print("\n--- Testing push_repository ---")
                # For a real test, you'd push to a repo you own and can write to.
                # This public repo (git-fixtures/basic.git) cannot be pushed to by us.
                # So, this test will likely fail on the push itself, which is expected.
                # The goal here is to test the logic of the function.
                # To truly test, you'd need to:
                # 1. Create a repo on GitHub under your account.
                # 2. Clone it using clone_repository.
                # 3. Make changes, commit.
                # 4. Push using push_repository.

                # We expect this to fail because we don't have push access to git-fixtures/basic.git
                # We will check if the error message indicates an authentication/permission issue
                push_success, push_message = push_repository(local_clone_path, github_token=test_token)
                if not push_success and "authentication failed" in str(push_message).lower() or "permission" in str(push_message).lower():
                    print(f"Push failed as expected due to permissions/authentication to public repo: {push_message}")
                    print("This indicates the function attempted the push correctly.")
                elif push_success:
                     print(f"Push successful (this is unexpected for the test repo): {push_message if push_message else 'No message'}")
                else:
                    print(f"Push failed: {push_message}")
        else:
            print(f"Cloning failed, skipping push test: {clone_message}")
    
    # Cleanup after test
    # if os.path.exists(local_clone_path):
    #     import shutil
    #     shutil.rmtree(local_clone_path)
    #     print(f"Cleaned up test directory: {local_clone_path}")
    # pass


def create_github_repository(repo_name: str, description: str, private: bool, github_token: str) -> tuple[dict | None, str | None]:
    """
    Creates a new repository on GitHub using the API.
    Parameters: repo_name, description, private (boolean).
    Uses github_token for authentication.
    Returns JSON response from API if successful, None otherwise, along with an error message.
    """
    if not github_token:
        logging.error("GitHub token is required for creating a repository.")
        return None, "GitHub token is required."

    api_url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    payload = {
        "name": repo_name,
        "description": description,
        "private": private,
    }

    logging.info(f"Creating GitHub repository '{repo_name}'...")
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
        
        repo_data = response.json()
        logging.info(f"Successfully created GitHub repository '{repo_name}'. URL: {repo_data.get('html_url')}")
        return repo_data, None
    except requests.exceptions.HTTPError as e:
        error_message = f"API request failed with status {e.response.status_code}: {e.response.text}"
        logging.error(error_message)
        # Try to parse GitHub's error message
        try:
            error_details = e.response.json()
            if 'errors' in error_details and error_details['errors']:
                detailed_errors = [err.get('message', 'Unknown error') for err in error_details['errors']]
                error_message = f"API request failed: {'; '.join(detailed_errors)}"
            elif 'message' in error_details:
                 error_message = f"API request failed: {error_details['message']}"
        except ValueError: # If response is not JSON
            pass # Keep the original error_message from response.text
        return None, error_message
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return None, str(e)
    except Exception as e:
        logging.error(f"An unexpected error occurred during repository creation: {e}")
        return None, str(e)


if __name__ == '__main__':
    # Example usage (replace with your actual details and ensure the token has repo scope)
    # Note: For security, avoid hardcoding tokens. Use environment variables or a config file.
    test_token = os.getenv("GITHUB_TOKEN", "YOUR_GITHUB_TOKEN") 
    
    # ... (previous test code for clone and push) ...
    print("\n--- Testing clone_repository (for push test setup) ---")
    # ... (rest of the clone and push test, ensuring it's runnable if token is present) ...
    if test_token == "YOUR_GITHUB_TOKEN":
        print("Skipping clone and push tests as GITHUB_TOKEN is not set.")
    else:
        # Cleanup before test
        if os.path.exists(local_clone_path):
            import shutil
            shutil.rmtree(local_clone_path)
            # print(f"Cleaned up existing directory: {local_clone_path}")

        clone_success, clone_message = clone_repository(repo_to_clone, local_clone_path, test_token)
        if clone_success:
            # print(f"Cloning successful: {local_clone_path}")
            try:
                with open(os.path.join(local_clone_path, "test_push_file.txt"), "w") as f:
                    f.write("This is a test file for pushing.\n")
                repo = git.Repo(local_clone_path)
                repo.index.add(["test_push_file.txt"])
                repo.index.commit("Test commit for push operation")
                # print("Created a dummy commit.")
            except Exception as e:
                # print(f"Failed to create dummy commit: {e}")
                clone_success = False 

            if clone_success:
                # print("\n--- Testing push_repository ---")
                push_success, push_message = push_repository(local_clone_path, github_token=test_token)
                # if not push_success and ("authentication failed" in str(push_message).lower() or "permission" in str(push_message).lower()):
                    # print(f"Push failed as expected due to permissions/authentication to public repo: {push_message}")
                # elif push_success:
                     # print(f"Push successful (this is unexpected for the test repo): {push_message if push_message else 'No message'}")
                # else:
                    # print(f"Push failed: {push_message}")
                pass # Suppress output for brevity in this combined script
        # else:
            # print(f"Cloning failed, skipping push test: {clone_message}")
        
        # Cleanup after push test
        if os.path.exists(local_clone_path):
            import shutil
            shutil.rmtree(local_clone_path)
            # print(f"Cleaned up test directory: {local_clone_path}")


    print("\n--- Testing create_github_repository ---")
    if test_token == "YOUR_GITHUB_TOKEN":
        print("Please replace YOUR_GITHUB_TOKEN with a real token or set GITHUB_TOKEN env var to test repository creation.")
    else:
        # IMPORTANT: Choose a unique repository name for testing to avoid conflicts.
        # This repo will be created on your GitHub account.
        test_repo_name = "my-test-api-repo-12345" 
        test_repo_desc = "A test repository created via API."
        
        created_repo_data, error_msg = create_github_repository(test_repo_name, test_repo_desc, True, test_token)
        if created_repo_data:
            print(f"Repository '{created_repo_data['name']}' created successfully. URL: {created_repo_data['html_url']}")
            # If you want to clean up (delete) this test repo afterwards, you'll need the delete function
            # For now, manual deletion might be required or use a known repo name for repeated tests
            # (though creation will fail if it already exists).
            print(f"To avoid clutter, manually delete '{test_repo_name}' from your GitHub account or implement delete and call it here.")
        else:
            print(f"Failed to create repository: {error_msg}")
            if "already exists" in str(error_msg):
                 print(f"Note: Repository '{test_repo_name}' might already exist. Consider deleting it or using a different name for testing.")
    # pass


def update_github_repository(owner: str, repo_name: str, github_token: str, description: str = None, homepage: str = None, private: bool = None) -> tuple[dict | None, str | None]:
    """
    Updates an existing repository on GitHub using the API.
    Parameters: owner, repo_name, github_token.
    Optional parameters for update: description, homepage, private (boolean).
    Uses github_token for authentication.
    Returns JSON response from API if successful, None otherwise, along with an error message.
    """
    if not github_token:
        logging.error("GitHub token is required for updating a repository.")
        return None, "GitHub token is required."

    api_url = f"https://api.github.com/repos/{owner}/{repo_name}"
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    payload = {}
    if description is not None:
        payload["description"] = description
    if homepage is not None:
        payload["homepage"] = homepage
    if private is not None:
        payload["private"] = private

    if not payload:
        logging.warning("No update parameters provided for update_github_repository.")
        # Or return an error, depending on desired behavior. For now, we'll allow it and let GitHub handle it (it might do nothing or error).
        # return None, "No update parameters provided." 
        # Let's proceed, GitHub will likely return the existing repo data if payload is empty.

    logging.info(f"Updating GitHub repository '{owner}/{repo_name}' with data: {payload}")
    try:
        response = requests.patch(api_url, headers=headers, json=payload)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
        
        repo_data = response.json()
        logging.info(f"Successfully updated GitHub repository '{owner}/{repo_name}'.")
        return repo_data, None
    except requests.exceptions.HTTPError as e:
        error_message = f"API request failed with status {e.response.status_code}: {e.response.text}"
        logging.error(error_message)
        try:
            error_details = e.response.json()
            if 'message' in error_details:
                 error_message = f"API request failed: {error_details['message']}"
        except ValueError:
            pass
        return None, error_message
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return None, str(e)
    except Exception as e:
        logging.error(f"An unexpected error occurred during repository update: {e}")
        return None, str(e)


if __name__ == '__main__':
    # Example usage (replace with your actual details and ensure the token has repo scope)
    test_token = os.getenv("GITHUB_TOKEN", "YOUR_GITHUB_TOKEN") 
    my_github_username = os.getenv("GITHUB_USERNAME", "your_username") # Replace or set GITHUB_USERNAME env var

    # ... (previous test code for clone, push, create) ...
    # For brevity, let's assume the create_repo test from before sets up a repo we can try to update.
    # If it ran successfully, we might have 'my-test-api-repo-12345'
    
    # Note: To keep tests somewhat independent and runnable,
    # we'll use the same repo name for create and update/delete tests.
    # This means if create fails, update/delete might also fail or target a non-existent repo.
    # A more robust test suite would handle this better.
    
    test_repo_name_for_create_update_delete = "my-test-api-repo-for-ops" # A consistent name for sequential tests

    print("\n--- Testing create_github_repository (for update/delete test setup) ---")
    if test_token == "YOUR_GITHUB_TOKEN" or my_github_username == "your_username":
        print("Please set GITHUB_TOKEN and GITHUB_USERNAME environment variables to test create/update/delete.")
    else:
        # Attempt to create the repo first (it might already exist, that's okay for this test flow)
        created_repo_data, error_msg = create_github_repository(
            test_repo_name_for_create_update_delete, 
            "Initial description for update/delete tests.", 
            True, 
            test_token
        )
        if created_repo_data:
            print(f"Test repository '{created_repo_data['name']}' ensured/created for update test.")
        elif "already exists" in str(error_msg):
            print(f"Test repository '{test_repo_name_for_create_update_delete}' already exists, proceeding with update test.")
        else:
            print(f"Failed to create repository for update test: {error_msg}. Skipping update test.")
            # Set a flag or skip if critical
            created_repo_data = None # Ensure it's None if creation failed and not due to existing

        if created_repo_data or "already exists" in str(error_msg): # Proceed if repo exists or was just created
            print("\n--- Testing update_github_repository ---")
            updated_description = "This is an updated description from the API."
            updated_homepage = "https://example.com/updated-repo-homepage"
            
            updated_repo_data, error_msg = update_github_repository(
                owner=my_github_username, 
                repo_name=test_repo_name_for_create_update_delete, 
                github_token=test_token,
                description=updated_description,
                homepage=updated_homepage,
                private=False # Change to public
            )
            if updated_repo_data:
                print(f"Repository '{updated_repo_data['name']}' updated successfully.")
                print(f"  New description: {updated_repo_data['description']}")
                print(f"  New homepage: {updated_repo_data['homepage']}")
                print(f"  New private status: {updated_repo_data['private']}")
                # Basic check
                if updated_repo_data['description'] == updated_description and updated_repo_data['private'] == False:
                    print("Update verification successful.")
                else:
                    print("Update verification failed or some fields were not updated as expected.")
            else:
                print(f"Failed to update repository: {error_msg}")
    
    # --- Testing delete_github_repository ---
    # WARNING: This will permanently delete the repository if successful.
    # Only run this if you are sure and have backed up important data.
    print("\n--- Testing delete_github_repository ---")
    if test_token == "YOUR_GITHUB_TOKEN" or my_github_username == "your_username":
        print("Skipping delete test as GITHUB_TOKEN or GITHUB_USERNAME is not set.")
    elif not (created_repo_data or "already exists" in str(error_msg)): # Check if repo was available for previous tests
        print(f"Skipping delete test as repository '{test_repo_name_for_create_update_delete}' was not available.")
    else:
        # Ask for confirmation before deleting
        # In a real testing script, you might automate this or have specific cleanup flags.
        # confirm = input(f"Are you sure you want to delete the repository '{test_repo_name_for_create_update_delete}' on GitHub? (yes/no): ")
        confirm = "yes" # Auto-confirm for automated environments; be cautious with this.
        
        if confirm.lower() == "yes":
            deleted_successfully, error_msg = delete_github_repository(
                owner=my_github_username, 
                repo_name=test_repo_name_for_create_update_delete, 
                github_token=test_token
            )
            if deleted_successfully:
                print(f"Repository '{test_repo_name_for_create_update_delete}' deleted successfully.")
            else:
                print(f"Failed to delete repository '{test_repo_name_for_create_update_delete}': {error_msg}")
        else:
            print(f"Deletion of repository '{test_repo_name_for_create_update_delete}' cancelled by user.")


def delete_github_repository(owner: str, repo_name: str, github_token: str) -> tuple[bool, str | None]:
    """
    Deletes a repository on GitHub using the API.
    Parameters: owner, repo_name, github_token.
    Uses github_token for authentication.
    Returns True if successful (status code 204), False otherwise, along with an error message.
    """
    if not github_token:
        logging.error("GitHub token is required for deleting a repository.")
        return False, "GitHub token is required."

    api_url = f"https://api.github.com/repos/{owner}/{repo_name}"
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    logging.info(f"Deleting GitHub repository '{owner}/{repo_name}'...")
    try:
        response = requests.delete(api_url, headers=headers)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
        
        if response.status_code == 204:
            logging.info(f"Successfully deleted GitHub repository '{owner}/{repo_name}'.")
            return True, None
        else:
            # This case should ideally be caught by raise_for_status for non-2XX codes,
            # but good to have a fallback.
            error_message = f"Delete request returned status {response.status_code}, expected 204. Response: {response.text}"
            logging.warning(error_message)
            return False, error_message
            
    except requests.exceptions.HTTPError as e:
        error_message = f"API request failed with status {e.response.status_code}: {e.response.text}"
        logging.error(error_message)
        try:
            error_details = e.response.json()
            if 'message' in error_details:
                 error_message = f"API request failed: {error_details['message']}"
        except ValueError:
            pass
        return False, error_message
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return False, str(e)
    except Exception as e:
        logging.error(f"An unexpected error occurred during repository deletion: {e}")
        return False, str(e)
# Final pass to ensure main guard is at the end of script
if __name__ == '__main__':
    # Example usage (replace with your actual details and ensure the token has repo scope)
    test_token = os.getenv("GITHUB_TOKEN", "YOUR_GITHUB_TOKEN") 
    my_github_username = os.getenv("GITHUB_USERNAME", "your_username") # Replace or set GITHUB_USERNAME env var
    repo_to_clone = "https://github.com/git-fixtures/basic.git" # A public test repo
    local_clone_path = "temp_cloned_repo_for_push_test"
    test_repo_name_for_create_update_delete = "my-test-api-repo-for-ops" # A consistent name

    # Test clone_repository
    print("\n--- Testing clone_repository (for push test setup) ---")
    if test_token == "YOUR_GITHUB_TOKEN":
        print("Skipping clone and push tests as GITHUB_TOKEN is not set.")
    else:
        if os.path.exists(local_clone_path):
            import shutil
            shutil.rmtree(local_clone_path)
        clone_success, clone_message = clone_repository(repo_to_clone, local_clone_path, test_token)
        if clone_success:
            try:
                with open(os.path.join(local_clone_path, "test_push_file.txt"), "w") as f: f.write("test")
                repo = git.Repo(local_clone_path)
                repo.index.add(["test_push_file.txt"])
                repo.index.commit("Test commit")
            except Exception as e: clone_success = False
            if clone_success:
                push_success, push_message = push_repository(local_clone_path, github_token=test_token)
        if os.path.exists(local_clone_path):
            import shutil
            shutil.rmtree(local_clone_path)

    # Test create_github_repository
    print("\n--- Testing create_github_repository (for update/delete test setup) ---")
    created_repo_data_for_ops = None
    error_msg_create_for_ops = "Skipped due to token/username missing."
    if test_token == "YOUR_GITHUB_TOKEN" or my_github_username == "your_username":
        print("Please set GITHUB_TOKEN and GITHUB_USERNAME environment variables to test create/update/delete.")
    else:
        # Clean up repo from previous failed run first (if any)
        # print(f"Attempting pre-cleanup of '{test_repo_name_for_create_update_delete}' before creation test...")
        # pre_delete_ok, pre_delete_msg = delete_github_repository(my_github_username, test_repo_name_for_create_update_delete, test_token)
        # if pre_delete_ok:
        #     print(f"Pre-cleanup of '{test_repo_name_for_create_update_delete}' successful or repo did not exist.")
        # else:
        #     print(f"Pre-cleanup of '{test_repo_name_for_create_update_delete}' failed: {pre_delete_msg}. This might be okay if it doesn't exist.")

        created_repo_data_for_ops, error_msg_create_for_ops = create_github_repository(
            test_repo_name_for_create_update_delete, "Initial desc.", True, test_token)
        if created_repo_data_for_ops:
            print(f"Test repository '{created_repo_data_for_ops['name']}' ensured/created.")
        elif "already exists" in str(error_msg_create_for_ops):
            print(f"Test repository '{test_repo_name_for_create_update_delete}' already exists.")
        else:
            print(f"Failed to create repository for ops tests: {error_msg_create_for_ops}.")

    # Test update_github_repository
    if created_repo_data_for_ops or ("already exists" in str(error_msg_create_for_ops) and not (test_token == "YOUR_GITHUB_TOKEN" or my_github_username == "your_username")):
        print("\n--- Testing update_github_repository ---")
        updated_desc = "Updated desc via API."
        updated_hp = "https://example.com/updated"
        updated_repo_data, error_msg_update = update_github_repository(
            my_github_username, test_repo_name_for_create_update_delete, test_token,
            description=updated_desc, homepage=updated_hp, private=False)
        if updated_repo_data:
            print(f"Repository '{updated_repo_data['name']}' updated. Private: {updated_repo_data['private']}")
        else:
            print(f"Failed to update repository: {error_msg_update}")
    else:
        print("\nSkipping update_github_repository test as prerequisite repo was not available.")

    # Test delete_github_repository
    print("\n--- Testing delete_github_repository ---")
    if test_token == "YOUR_GITHUB_TOKEN" or my_github_username == "your_username":
        print("Skipping delete test as GITHUB_TOKEN or GITHUB_USERNAME is not set.")
    elif not (created_repo_data_for_ops or "already exists" in str(error_msg_create_for_ops)):
        print(f"Skipping delete test as repository '{test_repo_name_for_create_update_delete}' was not available/created.")
    else:
        confirm_delete = "yes" # Auto-confirm for automated run
        if confirm_delete.lower() == "yes":
            print(f"Attempting to delete repository '{test_repo_name_for_create_update_delete}'...")
            deleted_successfully, error_msg_delete = delete_github_repository(
                my_github_username, test_repo_name_for_create_update_delete, test_token)
            if deleted_successfully:
                print(f"Repository '{test_repo_name_for_create_update_delete}' deleted successfully.")
            else:
                print(f"Failed to delete repository '{test_repo_name_for_create_update_delete}': {error_msg_delete}")
        else:
            print(f"Deletion of repository '{test_repo_name_for_create_update_delete}' cancelled.")
