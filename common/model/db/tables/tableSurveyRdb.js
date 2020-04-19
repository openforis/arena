import * as Schemata from '../schemata'
import TableSurvey from './tableSurvey'

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableSurveyRdb
 */
class TableSurveyRdb extends TableSurvey {
  constructor(surveyId, name, columnSet) {
    super(surveyId, name, columnSet)
    this.schema = Schemata.getSchemaSurveyRdb(this.surveyId)
  }
}

export default TableSurveyRdb
