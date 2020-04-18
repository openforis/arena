import * as Schemata from '../schemata'
import TableSurvey from './tableSurvey'

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableSurveyRdb
 */
class TableSurveyRdb extends TableSurvey {
  get schema() {
    return Schemata.getSchemaSurveyRdb(this.surveyId)
  }
}

export default TableSurveyRdb
