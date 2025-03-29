document.addEventListener("DOMContentLoaded", function () {
    const bidsList = document.getElementById('bids-list');
    let currentBids = [];

    // Fetch bids with proper error handling
    async function fetchBids() {
        try {
            const response = await fetch("/get-bids");
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got: ${text}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch bids');
            }
            
            currentBids = data.bids;
            updateBidListUI();
            
        } catch (error) {
            console.error("Fetch error:", error);
            bidsList.innerHTML = `
                <li class="error-message">
                    Error loading bids: ${error.message}
                    <button onclick="fetchBids()">Retry</button>
                </li>
            `;
        }
    }

    // Update UI with current bids
    function updateBidListUI() {
        bidsList.innerHTML = '';

        if (currentBids.length === 0) {
            bidsList.innerHTML = '<li class="no-bids">No bids available</li>';
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
                        <label>Customer Price:</label>
                        <span>$${bid.customerPrice.toFixed(2)}</span>
                    </div>
            `;

            if (bid.manufacturerPrice !== null) {
                bidHTML += `
                    <div class="price manufacturer-price">
                        <label>Your Price:</label>
                        <span>$${bid.manufacturerPrice.toFixed(2)}</span>
                    </div>
                `;
            }

            bidHTML += `</div>`;

            // Add action buttons based on status
            if (bid.status === 'Pending') {
                bidHTML += `
                    <div class="bid-actions">
                        <button class="btn accept-btn" 
                                onclick="handleManufacturerAction('${bid.id}', 'Accept')">
                            Accept Customer Price
                        </button>
                        <div class="counter-offer">
                            <input type="number" 
                                   id="price-${bid.id}" 
                                   placeholder="Your price" 
                                   min="0" 
                                   step="0.01">
                            <button class="btn counter-btn" 
                                    onclick="handleManufacturerAction('${bid.id}', 'Counter')">
                                Counter Offer
                            </button>
                        </div>
                    </div>
                `;
            }

            bidItem.innerHTML = bidHTML;
            bidsList.appendChild(bidItem);
        });
    }

    // Handle manufacturer actions
    window.handleManufacturerAction = async function(bidId, action) {
        try {
            let body = { id: bidId, action };
            
            if (action === 'Counter') {
                const priceInput = document.getElementById(`price-${bidId}`);
                const price = parseFloat(priceInput.value);
                
                if (isNaN(price)) {
                    alert('Please enter a valid price');
                    return;
                }
                
                body.manufacturerPrice = price;
            }

            const response = await fetch("/manufacturer-respond", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(body)
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