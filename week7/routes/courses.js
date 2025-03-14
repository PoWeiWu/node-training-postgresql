const express = require('express')
const router = express.Router()
const courseController = require('../controllers/courses')
const { IsNull } = require('typeorm')
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')
const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository('User'),
    logger
})

router.get('/', courseController.getCourses) //取得課程列表
router.post('/:courseId', auth, courseController.postBookingCourse) //報名課程
router.delete('/:courseId', auth, courseController.deleteBookingCourse) //取消課程

module.exports = router