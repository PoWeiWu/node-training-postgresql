const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin')
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')

const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})
const isCoach = require('../middlewares/isCoach')

//新增教練課程
router.post('/coaches/courses', auth, isCoach, adminController.postCoachesCourses)
// 編輯課程資料
router.put('/coaches/courses/:courseId', auth, isCoach, adminController.putEditCourses)
router.post('/coaches/:userId', adminController.postCoach) // 變更教練身分
router.put('/coaches', auth, isCoach, adminController.putCoach) // 修改教練資料
router.get('/coaches', auth, isCoach, adminController.getCoach) // 取得教練自己的詳細資料
module.exports = router