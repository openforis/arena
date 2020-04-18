import * as Schemata from '../schemata'
import Table from './table'

/**
 * @typedef {module:arena.Table} module:arena.TableSurvey
 */
class TableSurvey extends Table {
  constructor(surveyId, name, columnSet) {
    super(Schemata.getSchemaSurvey(surveyId), name, columnSet)
    this._surveyId = surveyId
  }

  get surveyId() {
    return this._surveyId
  }
}

export default TableSurvey
