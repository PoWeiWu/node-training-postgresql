const express = require('express')
const router = express.Router()

const coachesController = require('../controllers/coaches')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')

router.post('/skill', coachesController.postAddSkill) // 新增技能
router.get('/skill', coachesController.getSkills) // 取得技能列表
router.delete('/skill/:skillId', coachesController.deleteSkill) // 刪除教練專長
router.get('/:coachId', coachesController.getCoach) // 取得特定教練資料
router.get('/:coachId/courses', coachesController.getCoachCourses) //取得指定教練課程列表
router.get('/', coachesController.getCoaches) // 取得教練列表 /api/coaches/?per=&page=

module.exports = router