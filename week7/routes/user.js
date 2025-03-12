const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('User');

const generatJWT = require('../utils/generateJWT');
const { route } = require('./creditPackage');
const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository('User'),
    logger
})

// const saltRounds = 10;

function isUndefined(value) {
    return value === undefined
}

function isNotValidSting(value) {
    return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

// 新增使用者
router.post('/signup', async (req, res, next) => {
    try {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
        const { name, email, password } = req.body
        // 驗證必填欄位
        if (isUndefined(name) || isNotValidSting(name) || isUndefined(email) || isNotValidSting(email) || isUndefined(password) || isNotValidSting(password)) {
            logger.warn('欄位未填寫正確')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }
        if (!passwordPattern.test(password)) {
            logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
            res.status(400).json({
                status: 'failed',
                message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
            })
            return
        }
        const userRepository = dataSource.getRepository('User')
        // 檢查 email 是否已存在
        const existingUser = await userRepository.findOne({
            where: { email }
        })

        if (existingUser) {
            logger.warn('建立使用者錯誤: Email 已被使用')
            res.status(409).json({
                status: 'failed',
                message: 'Email 已被使用'
            })
            return
        }

        // 建立新使用者
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)
        const newUser = userRepository.create({
            name,
            email,
            role: 'USER',
            password: hashPassword
        })

        const savedUser = await userRepository.save(newUser)
        logger.info('新建立的使用者ID:', savedUser.id)

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: savedUser.id,
                    name: savedUser.name
                }
            }
        })
    } catch (error) {
        logger.error('建立使用者錯誤:', error)
        next(error)
    }
})

// 登入
router.post('/login', async (req, res, next) => {
    try {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
        const { email, password } = req.body

        if (isUndefined(email) || isNotValidSting(email) || isUndefined(password)) {
            logger.warn('欄位未填寫正確')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }

        if (!passwordPattern.test(password)) {
            logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
            res.status(400).json({
                status: 'failed',
                message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
            })
            return
        }

        const userRepository = dataSource.getRepository('User')
        const existingUser = await userRepository.findOne({
            select: ['id', 'name', 'password'],
            where: { email }
        })

        if (!existingUser) {
            res.status(400).json({
                status: 'failed',
                message: '使用者不存在或密碼輸入錯誤'
            })
            return
        }
        logger.info(`使用者資料: ${JSON.stringify(existingUser)}`)

        const isMatch = await bcrypt.compare(password, existingUser.password)
        if (!isMatch) {
            res.status(400).json({
                status: 'failed',
                message: '使用者不存在或密碼輸入錯誤'
            })
            return
        }
        const token = await generatJWT({
            id: existingUser.id,
        }, config.get('secret.jwtSecret'), {
            expiresIn: `${config.get('secret.jwtExpiresDay')}`
        })

        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: {
                    name: existingUser.name
                }
            }
        })

    } catch (error) {
        logger.error('登入錯誤:', error)
        next(error)
    }
})

router.get('/profile', auth, async (req, res, next) => {
    try {
        const { id } = req.user
        const userRepository = dataSource.getRepository('User')
        const user = await userRepository.findOne({
            select: ['name', 'email'],
            where: { id }
        })
        res.status(200).json({
            status: 'success',
            data: user
        })
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error)
        next(error)
    }
})

router.put('/profile', auth, async (req, res, next) => {
    try {
        const { id } = req.user
        const { name } = req.body

        if (isUndefined(name) || isNotValidSting(name)) {
            logger.warn('欄位未填寫正確')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }

        const userRepository = dataSource.getRepository('User')
        const user = await userRepository.findOne({
            select: ['name'],
            where: { id }
        })
        if (user.name === name) {
            res.status(400).json({
                status: 'failed',
                message: '使用者名稱未變更'
            })
            return
        }

        const updateResult = await userRepository.update({
            id,
            name: user.name
        }, {
            name
        })

        if (updateResult.affected === 0) {
            res.status(400).json({
                status: 'failed',
                message: '更新使用者資料失敗'
            })
            return
        }

        const result = await userRepository.findOne({
            select: ['name'],
            where: { id }
        })
        res.status(200).json({
            status: 'success',
            data: result
        })
    } catch (error) {
        logger.error('更新使用者資料錯誤:', error)
        next(error)
    }
})

// 取得所有使用者
router.get('/', async (req, res, next) => {
    try {
        const userRepository = dataSource.getRepository('User')
        const users = await userRepository.find({
            select: ['id', 'name', 'email', 'role']
        })
        res.status(200).json({
            status: 'success',
            data: users
        })
    } catch (error) {
        logger.error('取得使用者錯誤:', error)
        next(error)
    }
})

module.exports = router