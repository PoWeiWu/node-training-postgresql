const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')

function isUndefined(value) {
    return value === undefined
}

function isNotValidSting(value) {
    return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

function isNotValidInteger(value) {
    return typeof value !== 'number' || value < 0 || value % 1 !== 0
}

const creditPackageController = {
    getAllPackages: async (req, res, next) => {
        try {
            const creditPackage = await dataSource.getRepository('CreditPackage').find({
                select: ['id', 'name', 'credit_amount', 'price']
            })
            res.status(200).json({
                status: 'success',
                data: creditPackage
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    postAddPackage: async (req, res, next) => {
        try {
            const { name, credit_amount: creditAmount, price } = req.body
    
            if (isUndefined(name) || isNotValidSting(name) ||
                isUndefined(creditAmount) || isNotValidInteger(creditAmount) ||
                isUndefined(price) || isNotValidInteger(price)) {
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }
            const creditPurchaseRepo = await dataSource.getRepository('CreditPackage')
            const existCreditPurchase = await creditPurchaseRepo.find({
                where: {
                    name
                }
            })
            if (existCreditPurchase.length > 0) {
                res.status(409).json({
                    status: 'failed',
                    message: '資料重複'
                })
                return
            }
            const newCreditPurchase = await creditPurchaseRepo.create({
                name,
                credit_amount: creditAmount,
                price
            })
            const result = await creditPurchaseRepo.save(newCreditPurchase)
            res.status(200).json({
                status: 'success',
                data: {
                    id: result.id,
                    name: result.name,
                    credit_amount: result.credit_amount,
                    price: result.price
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    postUserBuy: async (req, res, next) => {
        try {
            const { id } = req.user
            const { creditPackageId } = req.params
    
            const creditPackageRepo = dataSource.getRepository('CreditPackage')
    
            const creditPackage = await creditPackageRepo.findOne({
                where: { id: creditPackageId }
            })
    
            if (!creditPackage) {
                res.status(400).json({
                    status: 'failed',
                    message: 'ID錯誤'
                })
                return
            }
    
            const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
            const creditPurchase = await creditPurchaseRepo.create({
                user_id: id,
                credit_package_id: creditPackageId,
                purchased_credits: creditPackage.credit_amount,
                price_paid: creditPackage.price,
                purchaseAt: new Date().toISOString()
            })
    
            await creditPurchaseRepo.save(creditPurchase)
    
            res.status(200).json({
                status: 'success',
                data: null
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    deletePackage: async (req, res, next) => {
        try {
            const { creditPackageId } = req.params
            if (isUndefined(creditPackageId) || isNotValidSting(creditPackageId)) {
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }
            const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId)
            if (result.affected === 0) {
                res.status(400).json({
                    status: 'failed',
                    message: 'ID錯誤'
                })
                return
            }
            res.status(200).json({
                status: 'success'
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    }
}

module.exports = creditPackageController