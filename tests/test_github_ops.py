import pytest
from unittest.mock import MagicMock, patch, call # patch can be used as a decorator or context manager
import os # For os.path related mocks

# Import functions from your script
# Assuming github_ops.py is in a directory called 'github_operations' at the root
# and your tests are in 'tests/' also at the root.
# You might need to adjust sys.path if your structure is different or use a proper package structure.
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from github_operations import github_ops # Now you can import your module
from git import GitCommandError # Import specific exception for testing
import requests # For requests.exceptions

# --- Constants for testing ---
MOCK_TOKEN = "test_token_123"
REPO_URL = "https://github.com/user/repo.git"
LOCAL_PATH = "temp/cloned_repo"
AUTH_REPO_URL = f"https://{MOCK_TOKEN}@github.com/user/repo.git"


# --- Tests for clone_repository ---

def test_clone_repository_success_new_path(mocker):
    """Test successful cloning when local_path does not exist."""
    mocker.patch('os.path.exists', return_value=False)
    mock_makedirs = mocker.patch('os.makedirs')
    mock_clone_from = mocker.patch('git.Repo.clone_from')
    
    success, message = github_ops.clone_repository(REPO_URL, LOCAL_PATH, MOCK_TOKEN)
    
    assert success is True
    assert message is None
    mock_makedirs.assert_called_once_with(LOCAL_PATH)
    mock_clone_from.assert_called_once_with(AUTH_REPO_URL, LOCAL_PATH)

def test_clone_repository_success_empty_existing_path(mocker):
    """Test successful cloning when local_path exists but is empty."""
    mocker.patch('os.path.exists', return_value=True)
    mocker.patch('os.listdir', return_value=[]) # Empty directory
    mock_makedirs = mocker.patch('os.makedirs') # Should not be called
    mock_clone_from = mocker.patch('git.Repo.clone_from')
    
    success, message = github_ops.clone_repository(REPO_URL, LOCAL_PATH, MOCK_TOKEN)
    
    assert success is True
    assert message is None
    mock_makedirs.assert_not_called()
    mock_clone_from.assert_called_once_with(AUTH_REPO_URL, LOCAL_PATH)

def test_clone_repository_fail_no_token(mocker):
    """Test cloning fails if no GitHub token is provided."""
    success, message = github_ops.clone_repository(REPO_URL, LOCAL_PATH, "")
    
    assert success is False
    assert "GitHub token is required" in message

def test_clone_repository_fail_path_exists_not_empty(mocker):
    """Test cloning fails if local_path exists and is not empty."""
    mocker.patch('os.path.exists', return_value=True)
    mocker.patch('os.listdir', return_value=['some_file.txt']) # Non-empty directory
    mock_clone_from = mocker.patch('git.Repo.clone_from') # Should not be called
    
    success, message = github_ops.clone_repository(REPO_URL, LOCAL_PATH, MOCK_TOKEN)
    
    assert success is False
    assert f"Local path '{LOCAL_PATH}' already exists and is not empty" in message
    mock_clone_from.assert_not_called()

def test_clone_repository_fail_git_command_error(mocker):
    """Test cloning fails if git.Repo.clone_from raises GitCommandError."""
    mocker.patch('os.path.exists', return_value=False)
    mocker.patch('os.makedirs')
    mock_clone_from = mocker.patch('git.Repo.clone_from', side_effect=GitCommandError("clone", "failed to clone"))
    
    success, message = github_ops.clone_repository(REPO_URL, LOCAL_PATH, MOCK_TOKEN)
    
    assert success is False
    assert "failed to clone" in message # Check if GitCommandError message is propagated
    mock_clone_from.assert_called_once_with(AUTH_REPO_URL, LOCAL_PATH)

def test_clone_repository_fail_unexpected_exception(mocker):
    """Test cloning fails with an unexpected exception during os operations."""
    mocker.patch('os.path.exists', side_effect=OSError("Disk full"))
    mock_clone_from = mocker.patch('git.Repo.clone_from')
    
    success, message = github_ops.clone_repository(REPO_URL, LOCAL_PATH, MOCK_TOKEN)
    
    assert success is False
    assert "Disk full" in message
    mock_clone_from.assert_not_called()

def test_clone_repository_malformed_url(mocker):
    """Test cloning fails with a malformed URL that doesn't contain '://'."""
    malformed_repo_url = "github.com/user/repo.git"
    success, message = github_ops.clone_repository(malformed_repo_url, LOCAL_PATH, MOCK_TOKEN)
    
    assert success is False
    assert f"Unexpected repo_url format: {malformed_repo_url}" in message

# --- Constants for push_repository tests ---
REMOTE_NAME = "origin"
BRANCH_NAME = "main"
ORIGINAL_REMOTE_URL = "https://github.com/user/repo.git"
AUTH_REMOTE_URL_PUSH = f"https://{MOCK_TOKEN}@github.com/user/repo.git"

# --- Tests for push_repository ---

@pytest.fixture
def mock_repo_for_push(mocker):
    """Fixture to create a mock Git repository object for push tests."""
    mock_repo = MagicMock(spec=github_ops.git.Repo)
    mock_remote = MagicMock()
    mock_remote.url = ORIGINAL_REMOTE_URL # Original URL before token injection
    
    # Configure the remote mock
    mock_repo.remote.return_value = mock_remote
    
    # Mock the repo constructor to return our mock_repo
    mocker.patch('git.Repo', return_value=mock_repo)
    return mock_repo, mock_remote

def test_push_repository_success(mocker, mock_repo_for_push):
    """Test successful push."""
    mock_repo, mock_remote = mock_repo_for_push
    
    # Mock push info to indicate success
    mock_push_info = MagicMock()
    mock_push_info.flags = 0 # No error, no rejection, etc.
    mock_push_info.summary = "Pushed successfully"
    mock_remote.push.return_value = [mock_push_info] # push returns a list of PushInfo

    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)

    assert success is True
    assert message is None
    mock_repo.remote.assert_called_once_with(name=REMOTE_NAME)
    mock_remote.set_url.assert_called_once_with(AUTH_REMOTE_URL_PUSH, old_url=ORIGINAL_REMOTE_URL)
    mock_remote.push.assert_called_once_with(refspec=f"{BRANCH_NAME}:{BRANCH_NAME}")
    # Check if original URL is restored (it shouldn't be on success, only on specific errors)
    # For this specific success case, the URL is left as authenticated.
    # If we wanted to ensure it's *always* restored, the function logic would need to change.

def test_push_repository_fail_no_token(mocker):
    """Test push fails if no GitHub token is provided."""
    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, "")
    assert success is False
    assert "GitHub token is required" in message

def test_push_repository_fail_invalid_repo(mocker):
    """Test push fails if local_path is not a valid Git repository."""
    mocker.patch('git.Repo', side_effect=github_ops.git.InvalidGitRepositoryError("Not a repo"))
    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    assert success is False
    assert "Invalid git repository" in message

def test_push_repository_fail_remote_not_found(mocker, mock_repo_for_push):
    """Test push fails if the specified remote does not exist."""
    mock_repo, _ = mock_repo_for_push
    mock_repo.remote.side_effect = GitCommandError("remote", "No such remote")
    
    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    
    assert success is False
    assert f"Remote '{REMOTE_NAME}' does not exist" in message

def test_push_repository_fail_push_error_flag(mocker, mock_repo_for_push):
    """Test push fails if PushInfo contains an ERROR flag."""
    mock_repo, mock_remote = mock_repo_for_push
    mock_push_info = MagicMock()
    mock_push_info.flags = github_ops.git.PushInfo.ERROR # Error flag
    mock_push_info.summary = "Push error occurred"
    mock_remote.push.return_value = [mock_push_info]

    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    
    assert success is False
    assert "Push failed: Push error occurred" in message
    # Check if original URL is restored after error (important for GitCommandError, might be complex for PushInfo errors)
    # The current code restores on GitCommandError, let's test that explicitly.
    # For PushInfo.ERROR, the current code does not explicitly restore.

def test_push_repository_fail_push_rejected_flag(mocker, mock_repo_for_push):
    """Test push fails if PushInfo contains a REJECTED flag."""
    mock_repo, mock_remote = mock_repo_for_push
    mock_push_info = MagicMock()
    mock_push_info.flags = github_ops.git.PushInfo.REJECTED # Rejected flag
    mock_push_info.summary = "Push was rejected"
    mock_remote.push.return_value = [mock_push_info]

    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    
    assert success is False
    assert "Push rejected: Push was rejected" in message

def test_push_repository_success_up_to_date(mocker, mock_repo_for_push):
    """Test push reports success (or specific message) if branch is already up-to-date."""
    mock_repo, mock_remote = mock_repo_for_push
    mock_push_info = MagicMock()
    mock_push_info.flags = github_ops.git.PushInfo.UP_TO_DATE # Up-to-date flag
    mock_remote.push.return_value = [mock_push_info]

    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    
    assert success is True # Or False, depending on how "up-to-date" should be treated
    assert f"Branch '{BRANCH_NAME}' is already up to date" in message

def test_push_repository_fail_git_command_error_restores_url(mocker, mock_repo_for_push):
    """Test push fails on GitCommandError during push and attempts to restore original URL."""
    mock_repo, mock_remote = mock_repo_for_push
    mock_remote.push.side_effect = GitCommandError("push", "failed to push")

    # This is to mock the second call to repo.remote() inside the except block for URL restoration
    mock_repo.remote.side_effect = [mock_remote, mock_remote] # First for setup, second for restoration attempt

    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    
    assert success is False
    assert "failed to push" in message
    
    # Check that set_url was called twice: once to set authed_url, once to restore
    expected_calls = [
        call(AUTH_REMOTE_URL_PUSH, old_url=ORIGINAL_REMOTE_URL), # Initial set with token
        call(ORIGINAL_REMOTE_URL, old_url=AUTH_REMOTE_URL_PUSH)  # Attempt to restore
    ]
    mock_remote.set_url.assert_has_calls(expected_calls)
    assert mock_remote.set_url.call_count == 2


def test_push_repository_fail_unexpected_exception(mocker):
    """Test push fails with an unexpected exception."""
    mocker.patch('git.Repo', side_effect=Exception("Unexpected error"))
    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)
    assert success is False
    assert "Unexpected error" in message

def test_push_repository_remote_url_already_authed(mocker, mock_repo_for_push):
    """Test push correctly handles remote URL that might already contain some auth info."""
    mock_repo, mock_remote = mock_repo_for_push
    # Simulate a remote URL that already has a (different) token or username
    mock_remote.url = f"https://olduser:oldtoken@github.com/user/repo.git"
    
    mock_push_info = MagicMock()
    mock_push_info.flags = 0 
    mock_push_info.summary = "Pushed successfully"
    mock_remote.push.return_value = [mock_push_info]

    success, message = github_ops.push_repository(LOCAL_PATH, REMOTE_NAME, BRANCH_NAME, MOCK_TOKEN)

    assert success is True
    # The important check is that the new token is used, replacing the old auth info
    # The AUTH_REMOTE_URL_PUSH is "https://{MOCK_TOKEN}@github.com/user/repo.git"
    # It correctly constructs this even if the original URL had "olduser:oldtoken@".
    mock_remote.set_url.assert_called_once_with(AUTH_REMOTE_URL_PUSH, old_url=f"https://olduser:oldtoken@github.com/user/repo.git")
    mock_remote.push.assert_called_once()


# --- Tests for create_github_repository ---

@pytest.fixture
def mock_requests_post(mocker):
    """Fixture for mocking requests.post."""
    mock_post = mocker.patch('requests.post')
    mock_response = MagicMock(spec=requests.Response)
    mock_post.return_value = mock_response
    return mock_post, mock_response

def test_create_github_repository_success(mocker, mock_requests_post):
    """Test successful repository creation."""
    mock_post, mock_response = mock_requests_post
    mock_response.status_code = 201
    mock_response.json.return_value = {"name": "new-repo", "html_url": "https://github.com/user/new-repo"}
    # mock_response.raise_for_status = MagicMock() # No need to mock if not raising an error

    repo_data, error_msg = github_ops.create_github_repository("new-repo", "A new repo", False, MOCK_TOKEN)

    assert repo_data is not None
    assert repo_data["name"] == "new-repo"
    assert error_msg is None
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert kwargs['json'] == {"name": "new-repo", "description": "A new repo", "private": False}
    assert kwargs['headers']['Authorization'] == f"token {MOCK_TOKEN}"

def test_create_github_repository_fail_no_token(mocker):
    """Test repository creation fails if no token is provided."""
    repo_data, error_msg = github_ops.create_github_repository("new-repo", "Desc", False, "")
    assert repo_data is None
    assert "GitHub token is required" in error_msg

def test_create_github_repository_fail_api_error_422(mocker, mock_requests_post):
    """Test repository creation fails with a 422 API error (e.g., repo exists)."""
    mock_post, mock_response = mock_requests_post
    mock_response.status_code = 422
    mock_response.json.return_value = {"message": "Repository creation failed", "errors": [{"message": "name already exists"}]}
    mock_response.text = '{"message": "Repository creation failed", "errors": [{"message": "name already exists"}]}'
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("422 Client Error")

    repo_data, error_msg = github_ops.create_github_repository("existing-repo", "Desc", False, MOCK_TOKEN)

    assert repo_data is None
    assert "API request failed: name already exists" in error_msg # Check for parsed error

def test_create_github_repository_fail_api_error_401(mocker, mock_requests_post):
    """Test repository creation fails with a 401 API error (unauthorized)."""
    mock_post, mock_response = mock_requests_post
    mock_response.status_code = 401
    mock_response.json.return_value = {"message": "Bad credentials"}
    mock_response.text = '{"message": "Bad credentials"}'
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("401 Client Error")

    repo_data, error_msg = github_ops.create_github_repository("new-repo", "Desc", False, "bad_token")

    assert repo_data is None
    assert "API request failed: Bad credentials" in error_msg

def test_create_github_repository_fail_request_exception(mocker, mock_requests_post):
    """Test repository creation fails due to a requests.exceptions.RequestException."""
    mock_post, _ = mock_requests_post
    mock_post.side_effect = requests.exceptions.ConnectionError("Connection timed out")

    repo_data, error_msg = github_ops.create_github_repository("new-repo", "Desc", False, MOCK_TOKEN)

    assert repo_data is None
    assert "Connection timed out" in error_msg


# --- Tests for update_github_repository ---

@pytest.fixture
def mock_requests_patch(mocker):
    """Fixture for mocking requests.patch."""
    mock_patch = mocker.patch('requests.patch')
    mock_response = MagicMock(spec=requests.Response)
    mock_patch.return_value = mock_response
    return mock_patch, mock_response

def test_update_github_repository_success(mocker, mock_requests_patch):
    """Test successful repository update."""
    mock_patch, mock_response = mock_requests_patch
    mock_response.status_code = 200
    updated_repo_details = {"description": "Updated desc", "homepage": "https://new.home.page", "private": True}
    mock_response.json.return_value = {"name": "my-repo", **updated_repo_details}

    repo_data, error_msg = github_ops.update_github_repository(
        owner="user", 
        repo_name="my-repo", 
        github_token=MOCK_TOKEN, 
        description="Updated desc", 
        homepage="https://new.home.page", 
        private=True
    )

    assert repo_data is not None
    assert repo_data["description"] == "Updated desc"
    assert repo_data["private"] is True
    assert error_msg is None
    mock_patch.assert_called_once()
    args, kwargs = mock_patch.call_args
    assert kwargs['json'] == updated_repo_details
    assert kwargs['headers']['Authorization'] == f"token {MOCK_TOKEN}"
    assert args[0] == "https://api.github.com/repos/user/my-repo"

def test_update_github_repository_success_partial_update(mocker, mock_requests_patch):
    """Test successful repository update with only some fields."""
    mock_patch, mock_response = mock_requests_patch
    mock_response.status_code = 200
    updated_repo_details = {"description": "Only description updated"}
    mock_response.json.return_value = {"name": "my-repo", **updated_repo_details}

    repo_data, error_msg = github_ops.update_github_repository(
        owner="user", 
        repo_name="my-repo", 
        github_token=MOCK_TOKEN, 
        description="Only description updated"
    )

    assert repo_data is not None
    assert repo_data["description"] == "Only description updated"
    assert error_msg is None
    mock_patch.assert_called_once()
    args, kwargs = mock_patch.call_args
    assert kwargs['json'] == updated_repo_details # Only description should be in payload

def test_update_github_repository_fail_no_token(mocker):
    repo_data, error_msg = github_ops.update_github_repository("user", "repo", "", description="desc")
    assert repo_data is None
    assert "GitHub token is required" in error_msg

def test_update_github_repository_no_params_provided(mocker, mock_requests_patch):
    """Test behavior when no updatable parameters are provided."""
    # The function currently proceeds with an empty payload, GitHub API might return current state or error.
    # Let's assume GitHub returns 200 with current state if payload is empty.
    mock_patch, mock_response = mock_requests_patch
    mock_response.status_code = 200
    current_repo_details = {"name": "my-repo", "description": "Current desc"}
    mock_response.json.return_value = current_repo_details
    
    repo_data, error_msg = github_ops.update_github_repository(
        owner="user", 
        repo_name="my-repo", 
        github_token=MOCK_TOKEN
    )
    # Depending on desired behavior, this could be a success or a specific warning.
    # Current code logs a warning but proceeds. Assuming it returns the current data.
    assert repo_data is not None
    assert repo_data["description"] == "Current desc"
    assert error_msg is None 
    mock_patch.assert_called_once()
    args, kwargs = mock_patch.call_args
    assert kwargs['json'] == {} # Empty payload

def test_update_github_repository_fail_api_error_404(mocker, mock_requests_patch):
    """Test update fails if repository is not found (404)."""
    mock_patch, mock_response = mock_requests_patch
    mock_response.status_code = 404
    mock_response.json.return_value = {"message": "Not Found"}
    mock_response.text = '{"message": "Not Found"}'
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("404 Client Error")

    repo_data, error_msg = github_ops.update_github_repository("user", "non-existent-repo", MOCK_TOKEN, description="desc")
    
    assert repo_data is None
    assert "API request failed: Not Found" in error_msg


# --- Tests for delete_github_repository ---

@pytest.fixture
def mock_requests_delete(mocker):
    """Fixture for mocking requests.delete."""
    mock_delete = mocker.patch('requests.delete')
    mock_response = MagicMock(spec=requests.Response)
    mock_delete.return_value = mock_response
    return mock_delete, mock_response

def test_delete_github_repository_success(mocker, mock_requests_delete):
    """Test successful repository deletion."""
    mock_delete, mock_response = mock_requests_delete
    mock_response.status_code = 204 # Successful deletion
    # mock_response.raise_for_status = MagicMock()

    success, error_msg = github_ops.delete_github_repository("user", "repo-to-delete", MOCK_TOKEN)

    assert success is True
    assert error_msg is None
    mock_delete.assert_called_once()
    args, kwargs = mock_delete.call_args
    assert args[0] == "https://api.github.com/repos/user/repo-to-delete"
    assert kwargs['headers']['Authorization'] == f"token {MOCK_TOKEN}"

def test_delete_github_repository_fail_no_token(mocker):
    success, error_msg = github_ops.delete_github_repository("user", "repo", "")
    assert success is False
    assert "GitHub token is required" in error_msg

def test_delete_github_repository_fail_api_error_404(mocker, mock_requests_delete):
    """Test deletion fails if repository is not found (404)."""
    mock_delete, mock_response = mock_requests_delete
    mock_response.status_code = 404
    mock_response.json.return_value = {"message": "Not Found"}
    mock_response.text = '{"message": "Not Found"}'
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("404 Client Error")

    success, error_msg = github_ops.delete_github_repository("user", "non-existent-repo", MOCK_TOKEN)

    assert success is False
    assert "API request failed: Not Found" in error_msg

def test_delete_github_repository_fail_api_error_403(mocker, mock_requests_delete):
    """Test deletion fails if forbidden (403)."""
    mock_delete, mock_response = mock_requests_delete
    mock_response.status_code = 403
    mock_response.json.return_value = {"message": "Forbidden"}
    mock_response.text = '{"message": "Forbidden"}'
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("403 Client Error")

    success, error_msg = github_ops.delete_github_repository("user", "protected-repo", MOCK_TOKEN)
    
    assert success is False
    assert "API request failed: Forbidden" in error_msg
