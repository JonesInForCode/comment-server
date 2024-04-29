const express = require('express');
const cors = require('cors')
const app = express();
const fs = require('fs');

// Read data from JSON db.json
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));

app.use(cors())

const requestLogger = (req, res, next) => {
    console.log('Method: ', req.method)
    console.log('Path: ', req.path)
    console.log('Body: ', req.body)
    console.log('---')
    next()
}

const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'unknown endpoint' })
}

app.use(requestLogger)

// serve the json data at /api/comments
app.get('/api/comments', (req, res) => {
    const responseData = {
        comments: data.comments,
        currentUser: data.currentUser
    };
    res.json(responseData);
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

app.put('/api/comments/:id', (req, res) => {
    const id = Number(req.params.id);
    const updatedComment = req.body;
    const commentIndex = data.comments.findIndex(comment => comment.id === id);

    if (commentIndex === -1) {
        return res.status(404).json({ error: 'comment not found' });
    }

    // Check if the current user matches the username of the comment being updated
    const comment = data.comments[commentIndex];
    if (comment.user.username !== data.currentUser.username) {
        return res.status(403).json({ error: `User is not authorized to edit this comment, or is not the owner` })
    }

    //update the comment
    data.comments[commentIndex] = {
        ...comment,
        ...updatedComment,
        user: comment.user
    }

    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.json(data.comments[commentIndex]);
});

app.delete('/api/comments/:id', (req, res) => {
    const id = Number(req.params.id)
    const commentIndex = data.comments.findIndex(comment => comment.id === id);

    if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = data.comments[commentIndex];

    // check is the current user matches the username of the comment being deleted
    if (comment.user.username !== data.currentUser.username) {
        return res.status(403).json({ error: 'You are not authorized to delete this comment'});
    }

    // Remove the comment from the array
    data.comments.splice(commentIndex, 1);
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.status(204).end();
});

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});