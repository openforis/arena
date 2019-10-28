import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as User from '@core/user/user'
import * as db from '@server/db/db'

import * as Activity from '../activity'

export const insert = async (user, surveyId, activity, client) =>
  client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [Activity.getType(activity), User.getUuid(user), Activity.getContent(activity), Activity.isSystem(activity)])

export const insertMany = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity => insert(user, surveyId, activity, client))
  ])

export const fetchAll = async (surveyId, client = db) =>
  await client.any(`SELECT * FROM ${getSurveyDBSchema(surveyId)}.activity_log`)
