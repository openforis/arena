import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const nameWithCountPattern = /^(.*)_(\d{1,2})$/ // everything ending with _ followed by 1 or 2 decimals

const parseName = (name) => {
  const match = name.match(nameWithCountPattern)
  return match
    ? {
        nameWithoutCount: match[1],
        count: Number(match[2]),
      }
    : {
        nameWithoutCount: name,
        count: 0,
      }
}

export const findUniqueSurveyName = async ({ startingName, client = db }) => {
  const surveyIdsAndNames = await SurveyManager.fetchSurveyIdsAndNames(client)

  const isDuplicate = (name) => surveyIdsAndNames.some(({ name: surveyName }) => surveyName === name)

  // extract count from startingName (suffix _NN added to the survey name, if any)
  let currentName = startingName
  let { count, nameWithoutCount } = parseName(startingName)

  while (isDuplicate(currentName)) {
    count += 1
    currentName = `${nameWithoutCount}_${count}`
  }
  return currentName
}
