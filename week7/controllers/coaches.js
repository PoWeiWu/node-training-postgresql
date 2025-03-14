const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')

function isUndefined(value) {
    return value === undefined
}

function isNotValidSting(value) {
    return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

const coachesController = {
    getCoaches: async (req, res, next) => {
        try {
            const { per, page } = req.query
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
    },
    getCoach: async (req, res, next) => {
        try {
            const coach = await dataSource.getRepository('Coach').findOne({
                where: { id: req.params.coachId }
            })
            const user = await dataSource.getRepository('User').findOne({
                where: { id: coach.user_id }
            })

            if (!coach) {
                res.status(400).json({
                    status: 'failed',
                    message: '找不到該教練'
                })
                return
            }
            res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        "name": user.name,
                        "role": user.role
                    },
                    coach: { ...coach }
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    getCoachCourses: async (req, res, next) => {
        try {
            const { per, page } = req.query
            const courses = await dataSource.getRepository('Course').find({
                select: ['id', 'name', 'price'],
                where: { coach_id: req.params.coachId },
                take: per,
                skip: (page - 1) * per
            })
            res.status(200).json({
                status: 'success',
                data: courses
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    postAddSkill: async (req, res, next) => {
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
                data: {
                    id: newSkill.id,
                    name: newSkill.name
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    getSkills: async (req, res, next) => {
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
    },
    deleteSkill: async (req, res, next) => {
        try {
            const { skillId } = req.params
            const skillRepo = dataSource.getRepository('Skill')
            const skill = await skillRepo.findOne({
                where: { id: skillId }
            })
            if (!skill) {
                res.status(404).json({
                    status: 'failed',
                    message: '找不到技能'
                })
                return
            }
            const result = await dataSource.getRepository('Skill').delete(skillId)
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

module.exports = coachesController