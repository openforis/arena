import * as Schemata from '../schemata'
import TableSurvey from './tableSurvey'

class TableSurveyRdb extends TableSurvey {
  constructor(surveyId, name, columnSet) {
    super(surveyId, name, columnSet)
    this.schema = Schemata.getSchemaSurveyRdb(this.surveyId)
  }
}

export default TableSurveyRdb
