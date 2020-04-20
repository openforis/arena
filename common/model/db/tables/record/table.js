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
}

TableRecord.columnSet = columnSet
