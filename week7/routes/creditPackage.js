const express = require('express')

const router = express.Router()
const creditPackageController = require('../controllers/creditPackage')
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')

const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository('User'),
    logger
})

router.get('/', creditPackageController.getAllPackages) //取得購買方案

router.post('/', creditPackageController.postAddPackage) // 新增購買方案

router.post('/:creditPackageId',auth, creditPackageController.postUserBuy) //使用者購買方案

router.delete('/:creditPackageId', creditPackageController.deletePackage) //刪除購買方案

module.exports = router
