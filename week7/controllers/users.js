const bcrypt = require('bcryptjs')
const config = require('../config/index');
const { IsNull, In } = require('typeorm');

const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('User');

const generatJWT = require('../utils/generateJWT');
const { sign } = require('jsonwebtoken');
const { put } = require('../routes/courses');

function isUndefined(value) {
    return value === undefined
}

function isNotValidSting(value) {
    return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

const userController = {
    signup: async (req, res, next) => {
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
    },
    login: async (req, res, next) => {
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
    },
    getProfile: async (req, res, next) => {
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
    },
    putProfile: async (req, res, next) => {
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
    },
    getAllUsers: async (req, res, next) => {
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
    },
    getUserPurchase: async (req, res, next) => {
        try {
            const { id } = req.user
            const creditPackageRepository = dataSource.getRepository('CreditPurchase')

            const userPurchasePackages = await creditPackageRepository.find({
                where: { user_id: id },
                relations: ['CreditPackage']
            })
            res.status(200).json({
                status: 'success',
                data: userPurchasePackages
            })
        } catch (error) {
            logger.error('取得使用者購買方案錯誤:', error)
            next(error)
        }
    },
    putPassword: async (req, res, next) => {
        try {
            //密碼規則是包含英文數字大小寫，最短8個字，最長16個字
            const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
            const { id } = req.user
            const { password, new_password, confirm_new_password } = req.body

            if (isUndefined(password) || isNotValidSting(password) ||
                isUndefined(new_password) || isNotValidSting(new_password) ||
                isUndefined(confirm_new_password) || isNotValidSting(confirm_new_password)) {
                logger.warn('欄位未填寫正確')
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }

            if (new_password !== confirm_new_password) {
                logger.warn('新密碼與驗證新密碼不一致')
                res.status(400).json({
                    status: 'failed',
                    message: '新密碼與驗證新密碼不一致'
                })
                return
            }

            if (!passwordPattern.test(new_password)) {
                logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
                res.status(400).json({
                    status: 'failed',
                    message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
                })
                return
            }

            if (password === new_password) {
                logger.warn('新密碼不能與舊密碼相同')
                res.status(400).json({
                    status: 'failed',
                    message: '新密碼不能與舊密碼相同同'
                })
                return
            }

            const userRepository = dataSource.getRepository('User')
            const user = await userRepository.findOne({
                select: ['password'],
                where: { id }
            })

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                res.status(400).json({
                    status: 'failed',
                    message: '舊密碼輸入錯誤'
                })
                return
            }

            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(new_password, salt)
            const updateResult = await userRepository.update({
                id,
                password: user.password
            }, {
                password: hashPassword
            })

            if (updateResult.affected === 0) {
                res.status(400).json({
                    status: 'failed',
                    message: '更新密碼失敗'
                })
                return
            }

            res.status(200).json({
                status: 'success',
                message: '更新密碼成功'
            })
        } catch (error) {
            logger.error('更新密碼錯誤:', error)
            next(error)
        }
    },
    getUserCourses: async (req, res, next) => {
        try {
            const { id } = req.user
            const bookingRepository = dataSource.getRepository('CourseBooking')

            const userBookingCourses = await bookingRepository.find({
                where: { user_id: id, cancelledAt: IsNull() },
                relations: ['Course']
            })

            const courses = userBookingCourses.map(booking => {
                return booking.Course
            })

            res.status(200).json({
                status: 'success',
                data: {
                    course_booking: courses
                }
            })
        } catch (error) {
            logger.error('取得使用者已報名課程錯誤:', error)
            next(error)
        }
    }
}

module.exports = userController