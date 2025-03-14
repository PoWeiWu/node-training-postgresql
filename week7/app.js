const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')

const logger = require('./utils/logger')('App')
const creditPackageRouter = require('./routes/creditPackage')
const userRouter = require('./routes/users')
const adminRouter = require('./routes/admin')         
// const skillRouter = require('./routes/skills')
const coachRouter = require('./routes/coaches')
const courseRouter = require('./routes/courses')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      req.body = req.raw.body
      return req
    }
  }
}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/healthcheck', (req, res) => {
  res.status(200)
  res.send('OK')
})
app.use('/api/credit-package', creditPackageRouter)
app.use('/api/users', userRouter)
app.use('/api/admin', adminRouter)
// app.use('/api/skills', skillRouter)
app.use('/api/courses', courseRouter)
app.use('/api/coaches', coachRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log.error(err)
  res.status(500).json({
    status: 'error',
    message: '伺服器錯誤'
  })
})

module.exports = app
