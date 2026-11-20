import Table from '../table'
import TableSurvey from '../tableSurvey'
import tranformCallback from './transformCallback'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  ownerUuid: 'owner_uuid',
  step: 'step',
  cycle: 'cycle',
  dateCreated: Table.columnSetCommon.dateCreated,
  preview: 'preview',
  validation: 'validation',
}

export default class TableRecord extends TableSurvey {
  static readonly columnSet = columnSet
  static readonly transformCallback = tranformCallback

  constructor(surveyId: number) {
    super(surveyId, 'record', columnSet)
  }

  get columnCycle(): string {
    return super.getColumn(columnSet.cycle)
  }
}
