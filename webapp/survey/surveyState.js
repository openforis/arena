import * as R from 'ramda'

import { getSurveyInfo } from '../../common/survey/survey'

const survey = 'survey'

/**
 * ======================
 * Survey State
 * ======================
 */

// READ
export const getSurvey = R.prop(survey)

export const getStateSurveyInfo = R.pipe(getSurvey, getSurveyInfo)

export const getStateSurveyId = R.pipe(getStateSurveyInfo, R.prop('id'))

