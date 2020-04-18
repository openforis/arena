import TableSurveyRdb from './tableSurveyRdb'

/**
 * @typedef {module:arena.TableSurveyRdb} module:arena.TableSurveyRdbResult
 */
class TableSurveyRdbResult extends TableSurveyRdb {
  constructor(surveyId, name, columnSet) {
    super(surveyId, `"_res_${name}"`, columnSet)
  }
}

export default TableSurveyRdbResult
