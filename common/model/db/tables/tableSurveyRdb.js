import * as Schemata from '../schemata'
import Table from './table'

/**
 * @typedef {module:arena.Table} module:arena.TableSurveyRdb
 */
class TableSurveyRdb extends Table {
  constructor(surveyId, name, columnSet) {
    super(Schemata.getSchemaSurveyRdb(surveyId), name, columnSet)
  }
}

export default TableSurveyRdb
