import TableSurvey from '../tableSurvey'

const columnSet = {
  uuid: 'uuid',
  ownerUuid: 'owner_uuid',
  step: 'step',
  cycle: 'cycle',
  dateCreated: 'date_created',
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

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
  }
}

TableRecord.columnSet = columnSet
