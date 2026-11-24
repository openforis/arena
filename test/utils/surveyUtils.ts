import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'

import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'

export const publishSurvey = async (user, surveyId, client = db) => {
  const publishJob = new SurveyPublishJob({ user, surveyId })
  await publishJob.start(client)
  if (publishJob.isFailed()) {
    throw new Error(`Survey publish failed: ${JSON.stringify(publishJob)}`)
  }
}

export const getNodeDefByPath = ({ survey, path }) => {
  const pathParts = Array.isArray(path) ? path : path.split('/')

  let currentNodeDef = null
  let currentParentDef = null

  pathParts.forEach((childName) => {
    if (currentParentDef) {
      currentNodeDef = Survey.getNodeDefChildByName(currentParentDef, childName)(survey)
    } else {
      currentNodeDef = Survey.getNodeDefRoot(survey)
    }

    currentParentDef = currentNodeDef
  })

  return currentNodeDef
}

export const getCategoryItem = ({ survey, categoryName, codesPath }) => {
  const category = Survey.getCategoryByName(categoryName)(survey)
  return Survey.getCategoryItemByHierarchicalCodes({
    categoryUuid: category.uuid,
    codesPath,
  })(survey)
}

export const getCategoryItemUuid = ({ survey, categoryName, codesPath }) => {
  const categoryItem = getCategoryItem({ survey, categoryName, codesPath })
  return categoryItem?.uuid
}
