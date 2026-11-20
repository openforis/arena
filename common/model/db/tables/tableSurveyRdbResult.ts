import type { ColumnSet } from './table'
import TableSurveyRdb from './tableSurveyRdb'

class TableSurveyRdbResult extends TableSurveyRdb {
  constructor(surveyId: number, name: string, columnSet?: ColumnSet) {
    super(surveyId, `_res_${name}`, columnSet)
  }
}

export default TableSurveyRdbResult
