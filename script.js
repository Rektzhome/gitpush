document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const githubTokenInput = document.getElementById('github-token');

    // Repo List
    const repoListUl = document.getElementById('repo-list');
    const noReposMessage = document.getElementById('no-repos-message');
    const selectedRepoDisplay = document.getElementById('selected-repo-display');

    // Clone
    const cloneForm = document.getElementById('clone-form');
    const cloneUrlInput = document.getElementById('clone-url');
    const cloneLocalPathInput = document.getElementById('clone-local-path');
    const cloneFeedback = document.getElementById('clone-feedback');

    // Push
    const pushForm = document.getElementById('push-form');
    const pushLocalPathInput = document.getElementById('push-local-path');
    const pushRemoteNameInput = document.getElementById('push-remote-name');
    const pushBranchNameInput = document.getElementById('push-branch-name');
    const pushButton = document.getElementById('push-button');
    const pushFeedback = document.getElementById('push-feedback');

    // Create
    const createForm = document.getElementById('create-form');
    const createRepoNameInput = document.getElementById('create-repo-name');
    const createRepoDescInput = document.getElementById('create-repo-desc');
    const createRepoPrivateSelect = document.getElementById('create-repo-private');
    const createFeedback = document.getElementById('create-feedback');

    // Update
    const updateForm = document.getElementById('update-form');
    const updateOwnerInput = document.getElementById('update-owner');
    const updateRepoNameDisplayInput = document.getElementById('update-repo-name-display');
    const updateRepoDescInput = document.getElementById('update-repo-desc');
    const updateRepoHomepageInput = document.getElementById('update-repo-homepage');
    const updateRepoPrivateSelect = document.getElementById('update-repo-private');
    const updateButton = document.getElementById('update-button');
    const updateFeedback = document.getElementById('update-feedback');

    // Delete
    const deleteForm = document.getElementById('delete-form');
    const deleteOwnerInput = document.getElementById('delete-owner');
    const deleteRepoNameDisplayInput = document.getElementById('delete-repo-name-display');
    const deleteButton = document.getElementById('delete-button');
    const deleteFeedback = document.getElementById('delete-feedback');

    // --- State ---
    let managedRepositories = []; // Array to store repo info { id, name, owner, localPath, fullName }
    let selectedRepo = null; // Stores the selected repo object
    let nextRepoId = 1; // Simple ID generator

    // --- Helper Functions ---
    function getAuthToken() {
        return githubTokenInput.value.trim();
    }

    function displayFeedback(element, message, type = 'info') {
        element.textContent = message;
        element.className = `feedback ${type}`; // success, error, loading
    }

    function clearFeedback(element) {
        element.textContent = '';
        element.className = 'feedback';
    }

    async function makeApiRequest(endpoint, method, body = null) {
        const token = getAuthToken();
        if (!token) {
            throw new Error("GitHub token is required. Please enter it above.");
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `token ${token}`
        };

        const config = {
            method: method,
            headers: headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`/api${endpoint}`, config); // Assuming backend is served at /api

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }
        // For DELETE 204 No Content
        if (response.status === 204) {
            return null; 
        }
        return response.json();
    }

    function renderRepoList() {
        repoListUl.innerHTML = ''; // Clear existing list
        if (managedRepositories.length === 0) {
            noReposMessage.style.display = 'block';
        } else {
            noReposMessage.style.display = 'none';
            managedRepositories.forEach(repo => {
                const li = document.createElement('li');
                li.textContent = `${repo.name} (${repo.fullName || 'Local/Unsynced'})`;
                li.dataset.repoId = repo.id;
                if (selectedRepo && selectedRepo.id === repo.id) {
                    li.classList.add('selected');
                }

                const selectBtn = document.createElement('button');
                selectBtn.textContent = 'Select';
                selectBtn.classList.add('select-repo-button');
                selectBtn.onclick = () => selectRepository(repo.id);
                
                li.appendChild(selectBtn);
                repoListUl.appendChild(li);
            });
        }
        updateSelectedRepoDisplay();
        toggleActionButtons();
    }
    
    function addManagedRepo(repoData, localPath) {
        // repoData could be from clone (git.Repo object like) or create (GitHub API response)
        let name, owner, fullName;

        if (repoData.html_url) { // From GitHub API (create or update)
            fullName = repoData.full_name; // "owner/repo_name"
            name = repoData.name;
            owner = repoData.owner.login;
        } else if (repoData.name) { // From a potential simplified clone response
            name = repoData.name;
            fullName = repoData.full_name || name; // Fallback if full_name not provided
            owner = repoData.owner || ''; 
        } else { // Fallback for URL based clone if backend doesn't return rich info
            const urlParts = cloneUrlInput.value.split('/');
            name = urlParts.pop().replace('.git', '') || 'Unknown Repo';
            owner = urlParts.pop() || 'Unknown Owner';
            fullName = `${owner}/${name}`;
        }
        
        const newRepo = {
            id: nextRepoId++,
            name: name,
            owner: owner,
            localPath: localPath || '', // Path on server, important for push
            fullName: fullName, // owner/repo_name, important for update/delete
            apiData: repoData // Store original API response if available
        };
        managedRepositories.push(newRepo);
        renderRepoList();
        return newRepo;
    }

    function selectRepository(repoId) {
        selectedRepo = managedRepositories.find(repo => repo.id === repoId) || null;
        if (selectedRepo) {
            // Pre-fill forms
            pushLocalPathInput.value = selectedRepo.localPath || '';
            
            updateOwnerInput.value = selectedRepo.owner || '';
            updateRepoNameDisplayInput.value = selectedRepo.name || '';
            // For update, ideally fetch current details if not already stored
            updateRepoDescInput.value = selectedRepo.apiData?.description || '';
            updateRepoHomepageInput.value = selectedRepo.apiData?.homepage || '';
            updateRepoPrivateSelect.value = (selectedRepo.apiData?.private !== undefined) ? selectedRepo.apiData.private.toString() : "";


            deleteOwnerInput.value = selectedRepo.owner || '';
            deleteRepoNameDisplayInput.value = selectedRepo.name || '';
        }
        renderRepoList(); // To highlight selection
    }

    function updateSelectedRepoDisplay() {
        if (selectedRepo) {
            selectedRepoDisplay.textContent = `${selectedRepo.name} (${selectedRepo.fullName || selectedRepo.localPath})`;
        } else {
            selectedRepoDisplay.textContent = 'None';
        }
    }

    function toggleActionButtons() {
        const repoIsSelected = selectedRepo !== null;
        pushButton.disabled = !repoIsSelected || !selectedRepo.localPath; // Push needs local path
        updateButton.disabled = !repoIsSelected || !selectedRepo.fullName; // Update needs owner/repo
        deleteButton.disabled = !repoIsSelected || !selectedRepo.fullName; // Delete needs owner/repo

        if (pushButton.disabled && repoIsSelected && !selectedRepo.localPath) {
             pushFeedback.textContent = "Push requires a 'Local Path (on server)' from cloning.";
             pushFeedback.className = 'feedback error';
        } else if (!pushButton.disabled) {
             clearFeedback(pushFeedback);
        }
    }


    // --- Event Handlers ---

    // Clone Repository
    cloneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const repoUrl = cloneUrlInput.value;
        const localPath = cloneLocalPathInput.value; // Path on server
        displayFeedback(cloneFeedback, 'Cloning...', 'loading');
        try {
            const result = await makeApiRequest('/clone', 'POST', { repo_url: repoUrl, local_path: localPath });
            displayFeedback(cloneFeedback, result.message || 'Repository cloned successfully!', 'success');
            // Assuming result contains some repo info and the local_path used on server
            const newRepo = addManagedRepo({ name: localPath, full_name: `${result.owner || 'unknown'}/${result.name || localPath}` }, result.local_path_used || localPath);
            selectRepository(newRepo.id); // Auto-select the newly cloned repo
            cloneForm.reset();
        } catch (error) {
            displayFeedback(cloneFeedback, error.message, 'error');
        }
    });

    // Push Repository
    pushForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedRepo || !selectedRepo.localPath) {
            displayFeedback(pushFeedback, 'Please select a cloned repository with a valid local path.', 'error');
            return;
        }
        const localPath = pushLocalPathInput.value; // Should be pre-filled from selectedRepo.localPath
        const remoteName = pushRemoteNameInput.value;
        const branchName = pushBranchNameInput.value;
        displayFeedback(pushFeedback, 'Pushing...', 'loading');
        try {
            const result = await makeApiRequest('/push', 'POST', { 
                local_path: localPath, 
                remote_name: remoteName, 
                branch_name: branchName 
            });
            displayFeedback(pushFeedback, result.message || 'Push successful!', 'success');
        } catch (error) {
            displayFeedback(pushFeedback, error.message, 'error');
        }
    });

    // Create Repository
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const repoName = createRepoNameInput.value;
        const description = createRepoDescInput.value;
        const isPrivate = createRepoPrivateSelect.value === 'true';
        displayFeedback(createFeedback, 'Creating repository...', 'loading');
        try {
            const result = await makeApiRequest('/create_repo', 'POST', { 
                repo_name: repoName, 
                description: description, 
                private: isPrivate 
            });
            displayFeedback(createFeedback, `Repository "${result.name}" created successfully!`, 'success');
            // Add to managed list, localPath will be empty as it's not cloned yet
            const newRepo = addManagedRepo(result, null); 
            selectRepository(newRepo.id); // Auto-select
            createForm.reset();
        } catch (error) {
            displayFeedback(createFeedback, error.message, 'error');
        }
    });

    // Update Repository
    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedRepo || !selectedRepo.owner || !selectedRepo.name) {
            displayFeedback(updateFeedback, 'Please select a repository to update.', 'error');
            return;
        }
        
        const payload = {
            owner: selectedRepo.owner,
            repo_name: selectedRepo.name,
            description: updateRepoDescInput.value || undefined, // Send undefined if empty to not change
            homepage: updateRepoHomepageInput.value || undefined,
            private: updateRepoPrivateSelect.value === "" ? undefined : (updateRepoPrivateSelect.value === 'true')
        };
        // Filter out undefined values so backend doesn't try to update with them if not provided
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);


        displayFeedback(updateFeedback, 'Updating repository...', 'loading');
        try {
            const result = await makeApiRequest('/update_repo', 'PATCH', payload);
            displayFeedback(updateFeedback, `Repository "${result.name}" updated successfully!`, 'success');
            // Update repository in local list
            selectedRepo.apiData = result; // Update with fresh data
            selectedRepo.name = result.name;
            selectedRepo.owner = result.owner.login;
            selectedRepo.fullName = result.full_name;
            // Re-render and re-select to update display and forms
            const currentId = selectedRepo.id;
            renderRepoList();
            selectRepository(currentId); 

        } catch (error) {
            displayFeedback(updateFeedback, error.message, 'error');
        }
    });

    // Delete Repository
    deleteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedRepo || !selectedRepo.owner || !selectedRepo.name) {
            displayFeedback(deleteFeedback, 'Please select a repository to delete.', 'error');
            return;
        }

        const confirmation = confirm(`Are you sure you want to delete the repository "${selectedRepo.fullName}"? This action cannot be undone.`);
        if (!confirmation) {
            displayFeedback(deleteFeedback, 'Deletion cancelled.', 'info');
            return;
        }

        displayFeedback(deleteFeedback, 'Deleting repository...', 'loading');
        try {
            await makeApiRequest('/delete_repo', 'DELETE', { 
                owner: selectedRepo.owner, 
                repo_name: selectedRepo.name 
            });
            displayFeedback(deleteFeedback, `Repository "${selectedRepo.fullName}" deleted successfully.`, 'success');
            
            // Remove from managed list
            managedRepositories = managedRepositories.filter(repo => repo.id !== selectedRepo.id);
            selectedRepo = null;
            renderRepoList();
            // Clear pre-filled delete form fields
            deleteOwnerInput.value = '';
            deleteRepoNameDisplayInput.value = '';

        } catch (error) {
            displayFeedback(deleteFeedback, error.message, 'error');
        }
    });

    // --- Initial Setup ---
    renderRepoList(); // Initial render (empty list)
    toggleActionButtons(); // Initial state of buttons
});
