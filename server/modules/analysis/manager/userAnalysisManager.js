import * as UserAnalysis from '@common/analysis/userAnalysis'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as UserAnalysisRepository from '../repository/userAnalysisRepository'

// ===== CREATE

export const insertUserAnalysis = async (surveyId, client = db) =>
  await client.tx(async t => {
    const userAnalysisExisting = await UserAnalysisRepository.fetchUserAnalysisBySurveyId(surveyId, t)
    if (userAnalysisExisting) {
      return userAnalysisExisting
    }

    const userAnalysis = await UserAnalysisRepository.insertUserAnalysis(surveyId, t)
    await DbUtils.createUser(UserAnalysis.getName(surveyId), UserAnalysis.getPassword(userAnalysis), t)
    return userAnalysis
  })

// ===== READ

export { fetchUserAnalysisBySurveyId } from '../repository/userAnalysisRepository'
