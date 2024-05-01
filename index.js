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
    const todaysDate = new Date().toISOString();
    newPost.createdAt = formatDate(todaysDate);
    
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
            const foundComment = findCommentById(comment.replies, id, comment);
            if (foundComment) {
                return foundComment;
            }
        }
     }
     return null;
 }

 //function to format the date to the required format
 const formatDate = (dateString) => {
    const createdAt = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Format dates for comparison
    const format = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayStr = today.toLocaleDateString('en-US', format);
    const yesterdayStr = yesterday.toLocaleDateString('en-US', format);
    const createdAtStr = createdAt.toLocaleDateString('en-US', format);

    if (createdAtStr === todayStr) {
        return 'Today';
    } else if (createdAtStr === yesterdayStr) {
        return 'Yesterday';
    } else {
        const differenceInTime = today.getTime() - createdAt.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        if (differenceInDays < 7) {
            return `${differenceInDays} day${differenceInDays > 1 ? 's' : ''} ago`;
        } else if (differenceInDays < 30) {
            const weeks = Math.floor(differenceInDays / 7);
            return `${weeks} week${weeks > 1?'s' : ''} ago`;
        } else if (differenceInDays >= 30) {
            const months = Math.floor(differenceInDays / 30);
            return `${months} month${months > 1?'s' : ''} ago`;
        }
    }
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

    let isDeleted = false;

    // function to recursively find and delete a comment or reply
    function deleteCommentOrReply(comments, id) {
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === id) {
                // if the comment is a top-level comment, delete it
                comments.splice(i, 1);
                return true;
            } else if (comments[i].replies) {
                // if the comment has replies, search for the comment in its replies
                const foundInReplies = deleteCommentOrReply(comments[i].replies, id);
                if (foundInReplies) {
                    return true;
                }
        }
    }
    return false;
    }

    // Attempt to delete the comment or reply
    isDeleted = deleteCommentOrReply(data.comments, id);

    if (!isDeleted) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    // Save the updated data to the JSON file
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    res.status(204).end();
});

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});