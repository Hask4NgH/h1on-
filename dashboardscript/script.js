// API Endpoints
const PROXY_API = "https://scriptblox-api-proxy.vercel.app/api/fetch";
const SEARCH_PROXY_API = "https://scriptblox-api-proxy.vercel.app/api/search";

// User and Time Information
const USER_INFO = {
    login: "Hask4NgH",
    lastAccess: "2025-03-06 01:30:39"
};

// Cache and State Management
const scriptsCache = new Map();
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let currentFilter = "";
let currentSort = "newest";
let isSearchMode = false;

// DOM Elements
const elements = {
    grid: document.getElementById("scripts-grid"),
    searchInput: document.getElementById("search-input"),
    filterSelect: document.getElementById("filter-select"),
    sortSelect: document.getElementById("sort-select"),
    searchButton: document.getElementById("search-button"),
    prevButton: document.getElementById("prev-button"),
    nextButton: document.getElementById("next-button"),
    pageNumbers: document.getElementById("page-numbers"),
    errorMessage: document.getElementById("error-message"),
    modal: document.getElementById("script-details-modal"),
    modalTitle: document.getElementById("modal-title"),
    modalDetails: document.getElementById("modal-details"),
    closeModal: document.getElementById("close-modal"),
    loadingOverlay: document.querySelector(".loading-overlay"),
    copyScript: document.getElementById("copy-script"),
    downloadScript: document.getElementById("download-script"),
    reportScript: document.getElementById("report-script"),
    activeFilters: document.getElementById("active-filters")
};

// Loading State Management
const loading = {
    show: () => elements.loadingOverlay.classList.remove("hidden"),
    hide: () => elements.loadingOverlay.classList.add("hidden")
};

// Error Handling
const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = "block";
    elements.grid.innerHTML = "";
    loading.hide();
};

// Update Active Filters Display
const updateActiveFilters = () => {
    const filters = [];
    if (currentQuery) filters.push(`Search: ${currentQuery}`);
    if (currentFilter) filters.push(`Filter: ${currentFilter}`);
    if (currentSort) filters.push(`Sort: ${currentSort}`);

    elements.activeFilters.innerHTML = filters.map(filter => 
        `<span class="active-filter">${filter}</span>`
    ).join("");
};

// Fetch Scripts
async function fetchScripts(page = 1) {
    loading.show();
    
    try {
        const cacheKey = `${currentQuery}-${currentFilter}-${currentSort}-${page}`;
        if (scriptsCache.has(cacheKey)) {
            const cachedData = scriptsCache.get(cacheKey);
            displayScripts(cachedData);
            updatePagination(page, totalPages);
            loading.hide();
            return;
        }

        const url = new URL(isSearchMode ? SEARCH_PROXY_API : PROXY_API);
        url.searchParams.append("page", page);
        
        if (isSearchMode) {
            url.searchParams.append("q", currentQuery);
            if (currentFilter) url.searchParams.append("mode", currentFilter);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.status === 429 
                ? "Too many requests. Please wait a moment." 
                : `Server error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.result?.scripts?.length) {
            throw new Error("No scripts found.");
        }

        // Update total pages from API response
        totalPages = data.result.totalPages || Math.ceil(data.result.total / 10);

        const sortedScripts = sortScripts(data.result.scripts);
        scriptsCache.set(cacheKey, sortedScripts);
        
        displayScripts(sortedScripts);
        updatePagination(page, totalPages);
        elements.errorMessage.style.display = "none";

    } catch (error) {
        showError(error.message);
    } finally {
        loading.hide();
    }
}

// Sort Scripts
function sortScripts(scripts) {
    return [...scripts].sort((a, b) => {
        switch (currentSort) {
            case "newest":
                return new Date(b.createdAt) - new Date(a.createdAt);
            case "oldest":
                return new Date(a.createdAt) - new Date(b.createdAt);
            case "popular":
                return (b.views || 0) - (a.views || 0);
            case "updated":
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            default:
                return 0;
        }
    });
}

// Display Scripts
function displayScripts(scripts) {
    elements.grid.innerHTML = scripts.map(script => `
        <div class="card" data-script='${JSON.stringify(script)}'>
            <img src="${getScriptImage(script)}" alt="${script.title}" 
                 onerror="this.src='https://files.catbox.moe/gamwb1.jpg';">
            <div class="card-content">
                <h2 class="card-title">${script.title}</h2>
                <p class="card-game">${script.game?.name || "Universal"}</p>
                <div class="tags">
                    <span class="tag">${script.scriptType}</span>
                    ${script.verified ? '<span class="tag verified">Verified</span>' : ''}
                    <span class="tag ${script.isPatched ? 'patched' : 'active'}">${script.isPatched ? 'Patched' : 'Active'}</span>
                </div>
            </div>
        </div>
    `).join("");

    // Add click listeners to cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const scriptData = JSON.parse(card.dataset.script);
            displayScriptDetails(scriptData);
        });
    });
}

// Get Script Image
function getScriptImage(script) {
    if (!script.game?.imageUrl) return "https://files.catbox.moe/gamwb1.jpg";
    return script.game.imageUrl.startsWith("http") 
        ? script.game.imageUrl 
        : `https://scriptblox.com${script.game.imageUrl}`;
}

// Display Script Details
function displayScriptDetails(script) {
    if (!script.script) {
        window.open(`https://scriptblox.com/script/${script.slug}`, '_blank');
        return;
    }

    elements.modalTitle.textContent = script.title;
    elements.modalDetails.innerHTML = `
        <div class="script-details">
            <div class="script-info">
                <h3>${script.game?.name || "Universal"}</h3>
                <div class="tags">
                    <span class="tag">${script.scriptType}</span>
                    ${script.verified ? '<span class="tag verified">Verified</span>' : ''}
                    <span class="tag ${script.isPatched ? 'patched' : 'active'}">
                        ${script.isPatched ? 'Patched' : 'Active'}
                    </span>
                </div>
            </div>
            <div class="code-container">
                <pre><code>${script.script}</code></pre>
            </div>
        </div>
    `;

    // Setup modal action buttons
    elements.copyScript.onclick = () => {
        navigator.clipboard.writeText(script.script).then(() => {
            elements.copyScript.textContent = "Copied!";
            setTimeout(() => elements.copyScript.textContent = "Copy Script", 2000);
        });
    };

    elements.downloadScript.onclick = () => {
        const blob = new Blob([script.script], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${script.title}.lua`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    elements.reportScript.onclick = () => {
        if (confirm("Are you sure you want to report this script?")) {
            alert("Script reported to moderators.");
        }
    };

    elements.modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

// Update Pagination
function updatePagination(currentPage, totalPages) {
    elements.prevButton.disabled = currentPage <= 1;
    elements.nextButton.disabled = currentPage >= totalPages;
    elements.pageNumbers.innerHTML = ''; // Remove page numbers
}

// Navigation Functions
function goToPage(page) {
    currentPage = page;
    if (isSearchMode) {
        searchScripts(currentQuery, currentFilter, page);
    } else {
        fetchScripts(page);
    }
}

// Event Listeners
elements.searchButton.addEventListener("click", () => {
    currentQuery = elements.searchInput.value.trim();
    currentFilter = elements.filterSelect.value;
    currentSort = elements.sortSelect.value;
    currentPage = 1;
    isSearchMode = !!currentQuery;
    updateActiveFilters();
    fetchScripts(currentPage);
});

elements.prevButton.addEventListener("click", () => {
    if (currentPage > 1) goToPage(currentPage - 1);
});

elements.nextButton.addEventListener("click", () => {
    goToPage(currentPage + 1);
});

elements.closeModal.addEventListener("click", () => {
    elements.modal.style.display = "none";
    document.body.style.overflow = "";
});

elements.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") elements.searchButton.click();
});

window.addEventListener("click", (e) => {
    if (e.target === elements.modal) {
        elements.modal.style.display = "none";
        document.body.style.overflow = "";
    }
});

// Sort and Filter Changes
elements.sortSelect.addEventListener("change", () => {
    currentSort = elements.sortSelect.value;
    currentPage = 1;
    updateActiveFilters();
    fetchScripts(currentPage);
});

elements.filterSelect.addEventListener("change", () => {
    currentFilter = elements.filterSelect.value;
    currentPage = 1;
    updateActiveFilters();
    fetchScripts(currentPage);
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    fetchScripts();
});