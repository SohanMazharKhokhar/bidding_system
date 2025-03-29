document.addEventListener("DOMContentLoaded", function () {
    const bidForm = document.getElementById("bid-form");
    const bidList = document.getElementById("bid-list");
    let currentBids = [];

    // Submit new bid
    bidForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const price = parseFloat(document.getElementById("price").value);
        const design = document.getElementById("design").value;

        // Validate inputs
        if (isNaN(price) || price <= 0) {
            alert("Please enter a valid price");
            return;
        }

        if (!design) {
            alert("Please select a design type");
            return;
        }

        try {
            const response = await fetch("/submit-bid", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ price, design })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to submit bid");
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || "Failed to submit bid");
            }

            alert(data.message);
            bidForm.reset();
            await fetchBids();
            
        } catch (error) {
            console.error("Submission error:", error);
            alert(`Error: ${error.message}`);
        }
    });

    // Fetch bids with error handling
    async function fetchBids() {
        try {
            // First check basic connectivity
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }
    
            const response = await fetch('http://localhost:3000/get-bids', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Important for session/cookies
            });
    
            // Check if the response exists
            if (!response) {
                throw new Error('No response from server');
            }
    
            // Check for HTTP errors
            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server response:', errorData);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
    
            // Verify content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Invalid content type. Received: ${contentType}`);
            }
    
            const data = await response.json();
            
            // Check if data structure is valid
            if (!data || !data.bids || !Array.isArray(data.bids)) {
                throw new Error('Invalid data format from server');
            }
    
            currentBids = data.bids;
            updateBidListUI();
            
        } catch (error) {
            console.error('Fetch error details:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check:';
                errorMessage += '\n1. Server is running (node server.js)';
                errorMessage += '\n2. Correct port (usually 3000)';
                errorMessage += '\n3. No browser extensions blocking requests';
            }
    
            bidList.innerHTML = `
                <li class="error-message">
                    ${errorMessage}
                    <button onclick="location.reload()">Refresh</button>
                    <button onclick="fetchBids()">Retry</button>
                </li>
            `;
        }
    }

    // Update UI with current bids
    function updateBidListUI() {
        bidList.innerHTML = '';

        if (currentBids.length === 0) {
            bidList.innerHTML = '<li class="no-bids">No bids submitted yet</li>';
            return;
        }

        currentBids.forEach(bid => {
            const bidItem = document.createElement('li');
            bidItem.className = `bid-item ${bid.status.toLowerCase()}`;
            bidItem.dataset.id = bid.id;

            let bidHTML = `
                <div class="bid-header">
                    <span class="design">${bid.design}</span>
                    <span class="status ${bid.status.toLowerCase()}">${bid.status}</span>
                </div>
                <div class="bid-details">
                    <div class="price customer-price">
                        <label>Your Price:</label>
                        <span>$${bid.customerPrice.toFixed(2)}</span>
                    </div>
            `;

            if (bid.manufacturerPrice !== null) {
                bidHTML += `
                    <div class="price manufacturer-price">
                        <label>Manufacturer's Price:</label>
                        <span>$${bid.manufacturerPrice.toFixed(2)}</span>
                    </div>
                `;
            }

            bidHTML += `</div>`;

            // Add action buttons for countered bids
            if (bid.status === 'Countered') {
                bidHTML += `
                    <div class="bid-actions">
                        <button class="btn accept-btn" 
                                onclick="handleCustomerAction('${bid.id}', 'Accept')">
                            Accept Offer
                        </button>
                        <button class="btn reject-btn" 
                                onclick="handleCustomerAction('${bid.id}', 'Reject')">
                            Reject Offer
                        </button>
                    </div>
                `;
            }

            bidItem.innerHTML = bidHTML;
            bidList.appendChild(bidItem);
        });
    }

    // Handle customer actions
    window.handleCustomerAction = async function(bidId, action) {
        try {
            const response = await fetch("/customer-respond", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ id: bidId, action })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Action failed');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Action failed');
            }

            alert(data.message);
            await fetchBids();
            
        } catch (error) {
            console.error("Action error:", error);
            alert(`Error: ${error.message}`);
        }
    };

    // Initial fetch
    fetchBids();
    
    // Auto-refresh every 5 seconds
    setInterval(fetchBids, 5000);
});