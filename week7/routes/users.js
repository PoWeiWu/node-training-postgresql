const express = require('express');

const router = express.Router();
const users = require('../controllers/users');
const config = require('../config/index');

const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('User');
const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository('User'),
    logger
})


router.post('/signup', users.signup); // 新增使用者
router.post('/login', users.login); // 登入
router.get('/profile', auth, users.getProfile); // 取得使用者資料
router.put('/profile', auth, users.putProfile); // 修改使用者資料
router.put('/password', auth, users.putPassword); // 使用者修改密碼
router.get('/credit-package', auth, users.getUserPurchase) // 取得使用者已購買的方案列表
router.get('/courses', auth, users.getUserCourses) // 取得使用者已報名的課程列表, 
router.get('/', auth, users.getAllUsers); // 取得所有使用者

module.exports = router