const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000', // or your client's origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "Invalid JSON payload" });
    }
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

app.get('/manufacturer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manufacturer.html'));
});

let bids = [];

// Submit new bid
app.post('/submit-bid', (req, res) => {
    try {
        const { price, design } = req.body;

        if (!price || !design) {
            return res.status(400).json({
                success: false,
                error: "Price and Design are required!"
            });
        }

        const newBid = { 
            id: Date.now().toString(),
            customerPrice: parseFloat(price), 
            manufacturerPrice: null,
            design, 
            status: 'Pending',
            lastUpdatedBy: 'customer',
            createdAt: new Date().toISOString()
        };
        
        bids.push(newBid);
        
        res.json({ 
            success: true,
            message: 'Bid submitted successfully!', 
            bid: newBid
        });

    } catch (error) {
        console.error("Submit bid error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// Get all bids
app.get('/get-bids', (req, res) => {
    try {
        res.json({
            success: true,
            bids: bids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error("Get bids error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch bids"
        });
    }
});

// Manufacturer response
app.post('/manufacturer-respond', (req, res) => {
    try {
        const { id, action, manufacturerPrice } = req.body;
        
        if (!id || !action) {
            return res.status(400).json({ 
                success: false,
                error: "Bid ID and action are required"
            });
        }

        const bidIndex = bids.findIndex(b => b.id === id);
        if (bidIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Bid not found"
            });
        }

        if (action === 'Accept') {
            bids[bidIndex].status = 'Accepted';
            bids[bidIndex].manufacturerPrice = bids[bidIndex].customerPrice;
            bids[bidIndex].lastUpdatedBy = 'manufacturer';
            
            return res.json({
                success: true,
                message: 'Bid accepted successfully',
                bid: bids[bidIndex]
            });
        }

        if (action === 'Counter') {
            if (!manufacturerPrice || isNaN(manufacturerPrice)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Valid manufacturer price is required"
                });
            }

            bids[bidIndex].status = 'Countered';
            bids[bidIndex].manufacturerPrice = parseFloat(manufacturerPrice);
            bids[bidIndex].lastUpdatedBy = 'manufacturer';
            
            return res.json({
                success: true,
                message: 'Counter offer submitted',
                bid: bids[bidIndex]
            });
        }

        return res.status(400).json({
            success: false,
            error: "Invalid action"
        });

    } catch (error) {
        console.error("Manufacturer respond error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// Customer response
app.post('/customer-respond', (req, res) => {
    try {
        const { id, action } = req.body;
        
        if (!id || !action) {
            return res.status(400).json({ 
                success: false,
                error: "Bid ID and action are required"
            });
        }

        const bidIndex = bids.findIndex(b => b.id === id);
        if (bidIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Bid not found"
            });
        }

        if (action === 'Accept') {
            bids[bidIndex].status = 'Accepted';
            bids[bidIndex].customerPrice = bids[bidIndex].manufacturerPrice;
            bids[bidIndex].lastUpdatedBy = 'customer';
            
            return res.json({
                success: true,
                message: 'Bid accepted successfully',
                bid: bids[bidIndex]
            });
        }

        if (action === 'Reject') {
            bids[bidIndex].status = 'Rejected';
            bids[bidIndex].lastUpdatedBy = 'customer';
            
            return res.json({
                success: true,
                message: 'Bid rejected',
                bid: bids[bidIndex]
            });
        }

        return res.status(400).json({
            success: false,
            error: "Invalid action"
        });

    } catch (error) {
        console.error("Customer respond error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
