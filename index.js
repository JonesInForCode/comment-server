const express = require('express')
const app = express()
const jsonServer = require('json-server')
const data = require('./db.json')

const server = jsonServer.create()
const router = jsonServer.router(data)

const middlewares = jsonServer.defaults()


server.post('/api/posts', (req, res) => {
    const newPost = { id: data.posts.length + 1, ...req.body }
    data.posts.push(newPost)
})

server.get('/api/posts', (req, res) => {
    res.json(data.posts)
})

server.use(middlewares)
server.use(router)

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
    console.log('JSON Server is running on port', PORT)
})
