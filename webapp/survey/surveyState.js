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

export const getSurveyId = R.pipe(
  getSurvey,
  getSurveyInfo,
  R.prop('id'),
)

