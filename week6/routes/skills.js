const express = require('express');

const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Skill');

function isUndefined(value) {
    return value === undefined
}

function isNotValidSting(value) {
    return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

router.get('/', async (req, res, next) => {
    try {
        const skills = await dataSource.getRepository('Skill').find({
            select: ['id', 'name']
        })
        res.status(200).json({
            status: 'success',
            data: skills
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body
        if (isUndefined(name) || isNotValidSting(name)) {
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }
        const skillRepo = await dataSource.getRepository('Skill')
        const existSkill = await skillRepo.find({
            where: {
                name
            }
        })
        if (existSkill.length > 0) {
            res.status(409).json({
                status: 'failed',
                message: '資料重複'
            })
            return
        }
        const newSkill = await skillRepo.create({
            name
        })
        await skillRepo.save(newSkill)
        res.status(201).json({
            status: 'success',
            data: newSkill
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

module.exports = router;