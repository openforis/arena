import * as ActivityLogRepository from './repository/activityLogRepository'

import * as Activity from './activity'

export const type = Activity.type
export const keys = Activity.keys

//===== CREATE
export const newActivity = Activity.newActivity

export const log = async (user, surveyId, type, content, system, client) =>
  await ActivityLogRepository.insert(user, surveyId, newActivity(type, content, system), client)

export const logMany = ActivityLogRepository.insertMany

//===== READ
export const fetchLogs = ActivityLogRepository.fetchAll
