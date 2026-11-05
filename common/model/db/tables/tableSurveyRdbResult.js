import TableSurveyRdb from './tableSurveyRdb'

class TableSurveyRdbResult extends TableSurveyRdb {
  constructor(surveyId, name, columnSet) {
    super(surveyId, `_res_${name}`, columnSet)
  }
}

export default TableSurveyRdbResult
