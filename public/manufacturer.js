document.addEventListener("DOMContentLoaded", function () {
    const bidsList = document.getElementById('bids-list');

    async function fetchBids() {
        try {
            const response = await fetch("/get-bids");
            const bids = await response.json();

            bidsList.innerHTML = '';

            bids.forEach((bid, index) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `Price: ${bid.price}, Design: ${bid.design}, Status: ${bid.status} 
                    <button onclick="updateBid(${index}, 'Accepted')">Accept</button>
                    <button onclick="updateBid(${index}, 'Rejected')">Reject</button>`;
                bidsList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    }

    window.updateBid = async function (index, action) {
        try {
            const response = await fetch("/update-bid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ index, action }),
            });

            if (!response.ok) throw new Error("Failed to update bid");

            const data = await response.json();
            alert(data.message);
            fetchBids();
        } catch (error) {
            console.error("Error updating bid:", error);
        }
    };

    // Load bids on page load
    fetchBids();
});
