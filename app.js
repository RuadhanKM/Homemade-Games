const express = require('express')
const app = express()
const port = 80
const hostname = 'localhost'

app.use(express.static("public"));

app.listen(port, hostname, () => {
	console.log(`App on ${hostname}:${port}`)
})