const express = require('express')
const app = express()
const jsonServer = require('json-server')
const data = require('./db.json')

const server = jsonServer.create()
const router = jsonServer.router(data)

const middlewares = jsonServer.defaults()


server.post('/api/comments', (req, res) => {
    const newPost = { id: data.comments.id, ...req.body }
    data.comments.push(newPost)
})

server.get('/api/comments', (req, res) => {
    res.json(data.comments)
})

server.use(middlewares)
server.use(router)

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
    console.log('JSON Server is running on port', PORT)
})
