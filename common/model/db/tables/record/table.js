import * as R from 'ramda'
import * as camelize from 'camelize'

import * as Record from '../../../../../core/record/record'
import * as Validation from '../../../../../core/validation/validation'

import Table from '../table'
import TableSurvey from '../tableSurvey'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  ownerUuid: 'owner_uuid',
  step: 'step',
  cycle: 'cycle',
  dateCreated: Table.columnSetCommon.dateCreated,
  preview: 'preview',
  validation: 'validation',
}

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableRecord
 */
export default class TableRecord extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'record', columnSet)
  }

  get columnCycle() {
    return super.getColumn(columnSet.cycle)
  }
}

TableRecord.columnSet = columnSet

/**
 * Transforms the result row of a query on the record table into a Record object.
 *
 * @param {!number} surveyId - The ID of the survey.
 * @param {boolean} [includeValidationFields=true] - Whether to include all the Validation fields.
 * @returns {Record} - The record object.
 */
TableRecord.dbTransformCallback = (surveyId, includeValidationFields = true) => (record) => {
  const validation = Record.getValidation(record)
  // camelize all but 'validation'
  return R.pipe(
    R.dissoc(Validation.keys.validation),
    camelize,
    R.assoc('surveyId', surveyId),
    R.assoc(
      Validation.keys.validation,
      includeValidationFields
        ? validation
        : {
            ...Validation.newInstance(Validation.isValid(validation)),
            [Validation.keys.counts]: Validation.getCounts(validation),
          }
    )
  )(record)
}
