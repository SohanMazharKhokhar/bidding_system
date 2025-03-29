const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public')); // Serve static files

// Serve pages correctly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

app.get('/manufacturer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manufacturer.html'));
});

let bids = []; // Store customer bids

// API to submit a bid
app.post('/submit-bid', (req, res) => {
    const { price, design } = req.body;

    if (!price || !design) {
        return res.status(400).json({ message: "Price and Design are required!" });
    }

    const newBid = { price, design, status: 'Pending', manufacturerPrice: null };
    bids.push(newBid);
    res.json({ message: 'Bid submitted successfully!', bids });
});

// API to get all bids
app.get('/get-bids', (req, res) => {
    res.json(bids);
});

// API for manufacturers to update bid price and status
app.post('/update-bid', (req, res) => {
    const { index, manufacturerPrice, action } = req.body;

    if (index >= 0 && index < bids.length) {
        if (manufacturerPrice) {
            bids[index].manufacturerPrice = manufacturerPrice;
            bids[index].status = "Waiting for Customer";
        }
        if (action) {
            bids[index].status = action;
        }
        res.json({ message: `Bid updated!`, bids });
    } else {
        res.status(400).json({ message: 'Invalid bid index' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
