import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import ColumnNodeDef from '../../tables/dataNodeDef/columnNodeDef'
import * as SQL from '../../sql'

export default class ViewColumnNodeDef extends ColumnNodeDef {
  constructor(table, nodeDef) {
    super(table, nodeDef)
  }

  determineColumnNames() {
    const names = super.determineColumnNames()
    if (NodeDef.isCode(this.nodeDef)) {
      // add label columns
      const langs = Survey.getLanguages(Survey.getSurveyInfo(this.table.survey))
      return [...names, ...langs.map((lang) => `${NodeDef.getName(this.nodeDef)}_label_${lang}`)]
    }
    return names
  }

  determineColumnTypes() {
    const types = super.determineColumnTypes()
    if (NodeDef.isCode(this.nodeDef)) {
      // add label column types
      const langs = Survey.getLanguages(Survey.getSurveyInfo(this.survey))
      return [...types, ...langs.map((_lang) => SQL.types.varchar)]
    }
    return types
  }
}
