import { db } from '@server/db/db'

import * as UserAnalysis from '@core/user/userAnalysis'

import * as UserAnalysisRepository from '../repository/userAnalysisRepository'

// ===== CREATE

export const insertUserAnalysis = async (surveyId, client = db) =>
  await client.tx(async t => {
    const userAnalysisExisting = await UserAnalysisRepository.fetchUserAnalysisBySurveyId(surveyId, t)
    if (userAnalysisExisting) {
      return userAnalysisExisting
    }

    const userAnalysis = await UserAnalysisRepository.insertUserAnalysis(surveyId, t)
    await UserAnalysisRepository.createUserDb(
      UserAnalysis.getName(userAnalysis),
      UserAnalysis.getPassword(userAnalysis),
      t,
    )
    return userAnalysis
  })

// ===== READ

export { fetchUserAnalysisBySurveyId } from '../repository/userAnalysisRepository'

// ===== DELETE

export const deleteUserAnalysisBySurveyId = async (surveyId, client = db) =>
  await client.tx(async t => {
    const userAnalysis = await UserAnalysisRepository.deleteUserAnalysisBySurveyId(surveyId, t)
    if (userAnalysis) {
      await UserAnalysisRepository.dropUserDb(UserAnalysis.getName(userAnalysis), t)
    }
  })
