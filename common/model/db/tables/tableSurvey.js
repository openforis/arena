import * as Schemata from '../schemata'
import Table from './table'

class TableSurvey extends Table {
  // eslint-disable-next-line class-methods-use-this
  getSchema(surveyId) {
    return Schemata.getSchemaSurvey(surveyId)
  }
}

export default TableSurvey
