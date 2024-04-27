const express = require('express');
const cors = require('cors')
const app = express();
const fs = require('fs');

// Read data from JSON db.json
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));

app.use(cors())

// serve the json data at /api/comments
app.get('/api/comments', (req, res) => {
    res.json(data.comments);
});

// add route to handle POST requests
app.post('/api/comments', (req, res) => {
    const newPost = req.body;
    data.comments.push(newPost);
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.json(newPost);
});

app.get('/api/comments/:id', (req, res) => {
    const id = Number(req.params.id)
    const comment = data.comments.find(comment => comment.id === id)
    if (comment) {
        res.json(comment)
    } else {
        res.status(404).json({ error: 'Comment not found' });
    }
});

app.delete('/api/comments/:id', (req, res) => {
    const id = Number(req.params.id)
    data.comments = data.comments.filter(comment => comment.id !== id)
    res.status(204).end()
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});