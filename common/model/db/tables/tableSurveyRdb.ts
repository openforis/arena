import * as Schemata from '../schemata'

import type { ColumnSet } from './table'
import TableSurvey from './tableSurvey'

class TableSurveyRdb extends TableSurvey {
  constructor(surveyId: number, name: string, columnSet?: ColumnSet) {
    super(surveyId, name, columnSet)
    this.schema = Schemata.getSchemaSurveyRdb(this.surveyId)
  }
}

export default TableSurveyRdb
