document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsList = document.getElementById('results');
  const selectAllCb = document.getElementById('selectAll');
  const deleteBtn = document.getElementById('deleteBtn');
  const resultCountSpan = document.getElementById('resultCount');
  const controlsDiv = document.getElementById('controls');
  const statusDiv = document.getElementById('status');

  let currentResults = [];

  // --- 1. Search History ---
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) return;

    statusDiv.textContent = 'Searching...';
    
    // Fetch up to 10,000 results matching the keyword from the dawn of time
    chrome.history.search({ text: query, maxResults: 10000, startTime: 0 }, (results) => {
      currentResults = results;
      resultsList.innerHTML = '';
      statusDiv.textContent = '';

      if (results.length === 0) {
        controlsDiv.style.display = 'none';
        deleteBtn.style.display = 'none';
        statusDiv.textContent = 'No results found.';
        statusDiv.style.color = '#5f6368';
        return;
      }

      controlsDiv.style.display = 'flex';
      deleteBtn.style.display = 'block';
      resultCountSpan.textContent = `${results.length} found`;
      selectAllCb.checked = false;
      updateDeleteButton();

      // Build the UI list
      results.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        // Use a checkbox with the URL as its value
        li.innerHTML = `
          <input type="checkbox" class="item-checkbox" value="${item.url}" id="item-${index}">
          <div class="item-info">
            <span class="item-title" title="${item.title}">${item.title || item.url}</span>
            <span class="item-url" title="${item.url}">${item.url}</span>
          </div>
        `;
        resultsList.appendChild(li);
      });

      // Add listeners to new checkboxes to update the Delete button count
      document.querySelectorAll('.item-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDeleteButton);
      });
    });
  });

  // --- 2. Select All Checkbox Logic ---
  selectAllCb.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
    });
    updateDeleteButton();
  });

  // --- 3. Update Delete Button Text ---
  function updateDeleteButton() {
    const checkedCount = document.querySelectorAll('.item-checkbox:checked').length;
    deleteBtn.textContent = `Delete Selected (${checkedCount})`;
    deleteBtn.disabled = checkedCount === 0;
    
    // Auto-uncheck "Select All" if not everything is checked
    if (checkedCount < currentResults.length) {
      selectAllCb.checked = false;
    }
  }

  // --- 4. Delete Selected Items ---
  deleteBtn.addEventListener('click', () => {
    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');
    if (checkedBoxes.length === 0) return;

    // Ask user for final confirmation
    if (!confirm(`Are you sure you want to delete ${checkedBoxes.length} items from your history?`)) {
      return;
    }

    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;
    let deletedCount = 0;

    checkedBoxes.forEach(box => {
      // Use Chrome API to delete the specific URL
      chrome.history.deleteUrl({ url: box.value }, () => {
        deletedCount++;
        
        // Remove the visual element from the list
        box.closest('li').remove();

        // When all selected items are deleted
        if (deletedCount === checkedBoxes.length) {
          statusDiv.style.color = '#0f9d58';
          statusDiv.textContent = `Successfully deleted ${deletedCount} items!`;
          updateDeleteButton();
          
          // Update total count
          const remainingCount = document.querySelectorAll('.item-checkbox').length;
          resultCountSpan.textContent = `${remainingCount} found`;
          
          if (remainingCount === 0) {
            controlsDiv.style.display = 'none';
            deleteBtn.style.display = 'none';
          }
        }
      });
    });
  });

  // Allow pressing "Enter" to search
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });
});