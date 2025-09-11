import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import TableSurveyRdb from '../tableSurveyRdb'
import TableOlapData from './table'

const generateViewName = ({ survey, cycle, entityDef, baseUnitDef }) => {
  const dataTable = new TableOlapData({ survey, cycle, entityDef, baseUnitDef })
  return dataTable.name + '_area_view'
}

export default class OlapAreaView extends TableSurveyRdb {
  constructor({ survey, cycle, entityDef, baseUnitDef }) {
    super(Survey.getId(survey), generateViewName({ survey, cycle, entityDef, baseUnitDef }))
    this._baseUnitDef = baseUnitDef
  }

  get baseUnitUuidColumnName() {
    return NodeDef.getName(this._baseUnitDef) + '_uuid'
  }

  get areaColumnName() {
    return 'area'
  }
}
