import 'dotenv/config'
import express from 'express'
import { createApp } from './src/app.js'

const port = Number(process.env.PORT ?? 8787)
const app = express()

createApp(app)

app.listen(port, () => {
  console.log(`ProjectMind API listening on http://localhost:${port}`)
})
