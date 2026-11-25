import * as Schemata from '../schemata'

import Table, { ColumnSet } from './table'

class TableSurvey extends Table {
  protected _surveyId: number

  constructor(surveyId: number, name: string, columnSet?: ColumnSet) {
    super(Schemata.getSchemaSurvey(surveyId), name, columnSet)
    this._surveyId = surveyId
  }

  get surveyId(): number {
    return this._surveyId
  }
}

export default TableSurvey
