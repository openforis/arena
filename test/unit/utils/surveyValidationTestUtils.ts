/**
 * Helpers to give a test survey stored node definition validations.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { getDefByName } from './assistantTestUtils'

/**
 * Stores node definition validations in the survey, by node definition name (the survey keeps them by uuid, as the
 * designer gets them from the server).
 * @param {object} survey - Survey.
 * @param {Record<string, object>} validationsByName - Validation of each node definition name.
 * @returns {object} The updated survey.
 */
export const withValidation = (survey: any, validationsByName: Record<string, any>): any => {
  const fields: Record<string, any> = {}
  for (const [name, validation] of Object.entries(validationsByName)) {
    fields[NodeDef.getUuid(getDefByName(survey, name))] = validation
  }
  return Survey.assocNodeDefsValidation(Validation.newInstance(false, fields))(survey)
}
