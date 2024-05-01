const express = require('express');
const cors = require('cors')
const app = express();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
app.use(express.json())

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
    newPost.id = uuidv4();
    if (newPost.parentId) {
        const parentComment = findCommentById(data.comments, newPost.parentId);
        if (!parentComment) {
            return res.status(404).json({ error: 'Parent comment not found' });
         }
         if (!parentComment.replies) {
             parentComment.replies = [];
         }
         parentComment.replies.push(newPost);
    } else {
        data.comments.push(newPost);
     }
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.json(newPost);
});

// Helper function to recursevely find a comment by its id
function findCommentById(comments, id) {
    for (const comment of comments) {
        if (comment.id === id) {
            return comment;
        }
        if (comment.replies) {
            const foundComment = findCommentById(comment.replies, id);
            if (foundComment) {
                return foundComment;
            }
        }
     }
     return null;
 }

app.get('/api/comments/:id', (req, res) => {
    const id = req.params.id;
    const comment = data.comments.find(comment => comment.id === id)
    if (comment) {
        res.json(comment)
    } else {
        res.status(404).json({ error: 'Comment not found' });
    }
});

app.put('/api/comments/:id', (req, res) => {
    const id = req.params.id;
    const updatedComment = req.body;

    // find the comment with the given id
    const comment = findCommentById(data.comments, id);

    if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    // update the comment with the new data
    Object.assign(comment, updatedComment);

    // Save the updated data to the JSON file
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.json(comment);
});

app.delete('/api/comments/:id', (req, res) => {
    const id = req.params.id;
    console.log(req.params.id);

    //find the comment with the given id using the recursive helper function
    const comment = findCommentById(data.comments, id);
    console.log(comment);

    if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    // check if the current user is the author of the comment
    if (comment.user.username!== data.currentUser.username) {
        return res.status(403).json({ error: 'You are not authorized to delete this comment'});
    }

    // remove the comment from the array
    const commentIndex = data.comments.findIndex(comment => comment.id === id);
    console.log(commentIndex);
    data.comments.splice(commentIndex, 1);
    console.log(data.comments);


    // save the updated data to the JSON file
    console.log(data);
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.status(204).end();
});

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});