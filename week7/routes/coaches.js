const express = require('express')
const router = express.Router()

const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')

// 取得教練列表 /api/coaches/?per=&page=
router.get('/', async (req, res, next) => {
    try {
        const { per , page } = req.query
        const coaches = await dataSource.getRepository('Coach').find({
            select: ['id', 'user_id'],
            relations: ['User'],
            take: per,
            skip: (page - 1) * per
        })
        const data = coaches.map(coach => ({
            id: coach.id,
            name: coach.User.name
        }))
        res.status(200).json({
            status: 'success',
            data
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

// 取得特定教練資料
router.get('/:coachId', async (req, res, next) => {
    try {
        const coach = await dataSource.getRepository('Coach').findOne({
            select: ['id', 'user_id'],
            relations: ['User'],
            where: { id: req.params.coachId }
        })
        if (!coach) {
            res.status(400).json({
                status: 'failed',
                message: '找不到該教練'
            })
            return
        }
        const data = {
            id: coach.id,
            name: coach.User.name
        }
        res.status(200).json({
            status: 'success',
            data
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

module.exports = router