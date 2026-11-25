import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as SB from './surveyBuilder'

/**
 * Creates and stores the target survey of a clone: a root entity with the integer key cluster_id_tgt.
 * @param {object} user - The survey owner.
 * @param {string} rootEntityName - Name of the root entity.
 * @returns {Promise<object>} The stored survey.
 */
export const createCloneTargetSurvey = (user: any, rootEntityName: string): Promise<any> =>
  SB.survey(
    user,
    SB.entity(rootEntityName, SB.attribute('cluster_id_tgt', NodeDef.nodeDefType.integer).key())
  ).buildAndStore()

/**
 * Deletes the surveys one at a time (each drops its schemas), skipping the ones not created.
 * @param {object[]} surveys - The surveys.
 * @returns {Promise<void>} Resolves when deleted.
 */
export const deleteSurveys = (surveys: any[]): Promise<void> =>
  surveys
    .filter(Boolean)
    .reduce(
      (previous: Promise<void>, survey) => previous.then(() => SurveyManager.deleteSurvey(Survey.getId(survey))),
      Promise.resolve()
    )
