document.addEventListener("DOMContentLoaded", function () {
    const bidForm = document.getElementById("bid-form");
    const bidList = document.getElementById("bid-list");

    bidForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        const price = document.getElementById("price").value;
        const design = document.getElementById("design").value;

        try {
            const response = await fetch("/submit-bid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price, design }),
            });

            if (!response.ok) throw new Error("Failed to submit bid");

            const data = await response.json();
            alert(data.message);
            displayBids();
        } catch (error) {
            console.error("Error submitting bid:", error);
        }
    });

    async function displayBids() {
        try {
            const response = await fetch("/get-bids");
            const bids = await response.json();

            bidList.innerHTML = '';

            bids.forEach((bid) => {
                const listItem = document.createElement('li');
                listItem.textContent = `Price: ${bid.price}, Design: ${bid.design}, Status: ${bid.status}`;
                bidList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    }

    // Load bids on page load
    displayBids();
});
