const { dataSource } = require('../db/data-source')
const Coach = require('../entities/Coach')
const logger = require('../utils/logger')('Admin')

function isUndefined(value) {
    return value === undefined
}

function isNotValidSting(value) {
    return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

function isNotValidInteger(value) {
    return typeof value !== 'number' || value < 0 || value % 1 !== 0
}

const adminController = {
    postCoachesCourses: async (req, res, next) => {
        try {
            const { id } = req.user
            const {
                skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
                max_participants: maxParticipants, meeting_url: meetingUrl
            } = req.body

            if (isUndefined(skillId) || isNotValidSting(skillId) ||
                isUndefined(name) || isNotValidSting(name) ||
                isUndefined(description) || isNotValidSting(description) ||
                isUndefined(startAt) || isNotValidSting(startAt) ||
                isUndefined(endAt) || isNotValidSting(endAt) ||
                isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
                isUndefined(meetingUrl) || isNotValidSting(meetingUrl) || !meetingUrl.startsWith('https')) {
                logger.warn('欄位未填寫正確')
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }

            const courseRepo = dataSource.getRepository('Course')
            const newCourse = courseRepo.create({
                user_id: id,
                skill_id: skillId,
                name,
                description,
                start_at: startAt,
                end_at: endAt,
                max_participants: maxParticipants,
                meeting_url: meetingUrl
            })

            const savedCourse = await courseRepo.save(newCourse)
            const course = await courseRepo.findOne({
                where: { id: savedCourse.id }
            })
            res.status(201).json({
                status: 'success',
                data: {
                    course
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    postCoach: async (req, res, next) => {
        try {
            const { userId } = req.params
            const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null } = req.body
            if (isUndefined(experienceYears) || isNotValidInteger(experienceYears) || isUndefined(description) || isNotValidSting(description)) {
                logger.warn('欄位未填寫正確')
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }
            if (profileImageUrl && !isNotValidSting(profileImageUrl) && !profileImageUrl.startsWith('https')) {
                logger.warn('大頭貼網址錯誤')
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }
            const userRepository = dataSource.getRepository('User')
            const existingUser = await userRepository.findOne({
                select: ['id', 'name', 'role'],
                where: { id: userId }
            })
            if (!existingUser) {
                logger.warn('使用者不存在')
                res.status(400).json({
                    status: 'failed',
                    message: '使用者不存在'
                })
                return
            } else if (existingUser.role === 'COACH') {
                logger.warn('使用者已經是教練')
                res.status(409).json({
                    status: 'failed',
                    message: '使用者已經是教練'
                })
                return
            }
            const coachRepo = dataSource.getRepository('Coach')
            const newCoach = coachRepo.create({
                user_id: userId,
                experience_years: experienceYears,
                description,
                profile_image_url: profileImageUrl
            })
            const updatedUser = await userRepository.update({
                id: userId,
                role: 'USER'
            }, {
                role: 'COACH'
            })
            if (updatedUser.affected === 0) {
                logger.warn('更新使用者失敗')
                res.status(400).json({
                    status: 'failed',
                    message: '更新使用者失敗'
                })
                return
            }
            const savedCoach = await coachRepo.save(newCoach)
            const savedUser = await userRepository.findOne({
                select: ['name', 'role'],
                where: { id: userId }
            })
            res.status(201).json({
                status: 'success',
                data: {
                    user: savedUser,
                    coach: savedCoach
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    putEditCourses: async (req, res, next) => {
        try {
            const { id } = req.user
            const { courseId } = req.params
            const {
                skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
                max_participants: maxParticipants, meeting_url: meetingUrl
            } = req.body

            if (isNotValidSting(courseId) ||
                isUndefined(skillId) || isNotValidSting(skillId) ||
                isUndefined(name) || isNotValidSting(name) ||
                isUndefined(description) || isNotValidSting(description) ||
                isUndefined(startAt) || isNotValidSting(startAt) ||
                isUndefined(endAt) || isNotValidSting(endAt) ||
                isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
                isUndefined(meetingUrl) || isNotValidSting(meetingUrl) || !meetingUrl.startsWith('https')) {
                logger.warn('欄位未填寫正確')
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }
            const courseRepo = dataSource.getRepository('Course')
            const existingCourse = await courseRepo.findOne({
                where: { id: courseId, user_id: id }
            })

            if (!existingCourse) {
                logger.warn('課程不存在')
                res.status(400).json({
                    status: 'failed',
                    message: '課程不存在'
                })
                return
            }
            const updateCourse = await courseRepo.update({
                id: courseId
            }, {
                skill_id: skillId,
                name,
                description,
                start_at: startAt,
                end_at: endAt,
                max_participants: maxParticipants,
                meeting_url: meetingUrl
            })
            if (updateCourse.affected === 0) {
                logger.warn('更新課程失敗')
                res.status(400).json({
                    status: 'failed',
                    message: '更新課程失敗'
                })
                return
            }
            const savedCourse = await courseRepo.findOne({
                where: { id: courseId }
            })
            res.status(200).json({
                status: 'success',
                data: {
                    course: savedCourse
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    // 變更教練資料
    putCoach: async (req, res, next) => {
        try {
            const { id } = req.user
            const { experience_years, description, profile_image_url, skill_ids } = req.body

            if (isUndefined(experience_years) || isNotValidInteger(experience_years) ||
                isUndefined(description) || isNotValidSting(description) ||
                isUndefined(profile_image_url) || isNotValidSting(profile_image_url) ||
                isUndefined(skill_ids) || !Array.isArray(skill_ids) || skill_ids.length === 0 ||
                !profile_image_url.startsWith('https')) {
                logger.warn('欄位未填寫正確')
                res.status(400).json({
                    status: 'failed',
                    message: '欄位未填寫正確'
                })
                return
            }

            const coachRepo = dataSource.getRepository('Coach')
            const coach = await coachRepo.findOne({
                select: ['id'],
                where: { user_id: id }
            })

            if (!coach) {
                logger.warn('找不到教練')
                res.status(400).json({
                    status: 'failed',
                    message: '找不到教練'
                })
                return
            }
            // 更新教練基本資料
            await coachRepo.update({
                user_id: id
            }, {
                experience_years,
                description,
                profile_image_url
            })

            // 更新教練技能
            const coachSkillRepo = dataSource.getRepository('CoachLinkSkill')
            const newCoachSkills = skill_ids.map((skill) => {
                return {
                    coach_id: coach.id,
                    skill_id: skill
                }
            })

            await coachSkillRepo.delete({
                coach_id: coach.id
            })
            
            const insert = await coachSkillRepo.insert(newCoachSkills)
            const result = await coachRepo.find({
                select: {
                    id: true,
                    experience_years: true,
                    description: true,
                    profile_image_url: true,
                    CoachLinkSkill: {
                        skill_id: true
                    }
                },
                where: { id: coach.id },
                relations: ['CoachLinkSkill']
            })

            res.status(200).json({
                status: 'success',
                data: {
                    coach: result
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    },
    getCoach: async (req, res, next) => {
        try {
            const { id } = req.user
            console.log("====================")
            console.log(id)
            console.log("====================")
            const coachRepo = dataSource.getRepository('Coach')
            const coach = await coachRepo.findOne({
                select: {
                    id: true,
                    experience_years: true,
                    description: true,
                    profile_image_url: true,
                    CoachLinkSkill: {
                        skill_id: true
                    }
                },
                where: { user_id: id },
                relations: ['CoachLinkSkill']
            })

            if (!coach) {
                logger.warn('找不到教練')
                res.status(400).json({
                    status: 'failed',
                    message: '找不到教練'
                })
                return
            }

            res.status(200).json({
                status: 'success',
                data: {
                    id: coach.id,
                    experience_years: coach.experience_years,
                    description: coach.description,
                    profile_image_url: coach.profile_image_url,
                    skill_ids: coach.CoachLinkSkill.map(skill => skill.skill_id)
                }
            })
        } catch (error) {
            logger.error(error)
            next(error)
        }
    }
}

module.exports = adminController