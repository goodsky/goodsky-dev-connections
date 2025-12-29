const express = require('express');

const PUBLIC_DIR = path.join(__dirname, '../public');
const INDEX = path.join(PUBLIC_DIR, 'index.html');

const app = express();
app.use(express.json());

// Serve the client application
app.use(express.static(PUBLIC_DIR));

app.get('/*splat', (req, res) => {
    res.sendFile(INDEX);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});