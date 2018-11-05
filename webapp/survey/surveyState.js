import * as R from 'ramda'

import Survey from '../../common/survey/survey'

const survey = 'survey'

/**
 * ======================
 * Survey State
 * ======================
 */

// READ
export const getSurvey = R.prop(survey)

export const getStateSurveyInfo = R.pipe(getSurvey, Survey.getSurveyInfo)

export const getStateSurveyId = R.pipe(getStateSurveyInfo, R.prop('id'))

