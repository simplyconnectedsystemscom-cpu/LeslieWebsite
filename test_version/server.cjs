const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// Vite removed

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize Database
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], designs: [], stats: { totalUsers: 0, totalDesigns: 0 } }, null, 2));
}

// Helper to read DB
const readDB = () => {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE));
    } catch (e) {
        return { users: [], designs: [], stats: { totalUsers: 0, totalDesigns: 0 } };
    }
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// API: Login / Register
app.post('/api/login', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const db = readDB();
    let user = db.users.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (!user) {
        user = { id: Date.now().toString(), name, joinDate: new Date().toISOString() };
        db.users.push(user);
        db.stats.totalUsers++;
        writeDB(db);
    }

    res.json({ user });
});

// API: Save Design
app.post('/api/designs', (req, res) => {
    const { userId, designData } = req.body; // designData should include name, config, etc.
    if (!userId || !designData) return res.status(400).json({ error: 'Missing data' });

    const db = readDB();
    const user = db.users.find(u => u.id === userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const newDesign = {
        id: Date.now().toString(),
        userId,
        userName: user.name,
        timestamp: new Date().toISOString(),
        data: designData
    };

    db.designs.push(newDesign);
    db.stats.totalDesigns++;
    writeDB(db);

    res.json({ success: true, designId: newDesign.id });
});

// API: Get User Designs
app.get('/api/designs/:userId', (req, res) => {
    const { userId } = req.params;
    const db = readDB();
    const designs = db.designs.filter(d => d.userId === userId);
    res.json(designs);
});

// API: Get Global Stats
app.get('/api/stats', (req, res) => {
    const db = readDB();

    // Calculate simple popular stats
    const tzitzitCounts = {};
    const colorCounts = {};

    db.designs.forEach(d => {
        if (d.data.tzitzitType) {
            const t = d.data.tzitzitType.name || 'Unknown';
            tzitzitCounts[t] = (tzitzitCounts[t] || 0) + 1;
        }
        if (d.data.baseColor) {
            const c = d.data.baseColor.name || 'Unknown';
            colorCounts[c] = (colorCounts[c] || 0) + 1;
        }
    });

    const popularTzitzit = Object.entries(tzitzitCounts).sort((a, b) => b[1] - a[1])[0] || ['None', 0];
    const popularColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    res.json({
        totalUsers: db.stats.totalUsers,
        totalDesigns: db.stats.totalDesigns,
        popularTzitzit: popularTzitzit[0],
        popularColor: popularColor[0]
    });
});

// Start Server (Standalone API)
app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
});

