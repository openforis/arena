import React from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import Checkbox from '@webapp/commonComponents/form/checkbox'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'
import { updateCollectImportReportItem } from '../actions'

const TableRow = props => {
  const { i18n, item, idx, nodeDef, nodeDefPath, languages, updateCollectImportReportItem } = props
  const history = useHistory()

  return (
    <div key={idx} className="table__row">
      <div>{idx + 1}</div>
      <div>{nodeDefPath}</div>
      <div>{i18n.t(`homeView.collectImportReport.exprType.${CollectImportReportItem.getExpressionType(item)}`)}</div>
      <div>{CollectImportReportItem.getExpression(item)}</div>
      <div>{CollectImportReportItem.getApplyIf(item)}</div>
      <div>
        <LabelsEditor
          labels={CollectImportReportItem.getMessages(item)}
          languages={languages}
          readOnly={true}
          showFormLabel={false}
          maxPreview={1}
          compactLanguage={true}
        />
      </div>
      <div>
        <Checkbox
          checked={CollectImportReportItem.isResolved(item)}
          onChange={checked => updateCollectImportReportItem(item.id, checked)}
        />
      </div>
      <div>
        <button
          className="btn btn-transparent"
          onClick={() => history.push(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)}
        >
          <span className="icon icon-12px icon-pencil2" />
        </button>
      </div>
    </div>
  )
}

const _getNodeDefPath = (survey, nodeDef, lang) => {
  const nodeDefPathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, def => nodeDefPathParts.unshift(NodeDef.getLabel(def, lang)))(survey)

  return nodeDefPathParts.join(' > ')
}

const mapStateToProps = (state, props) => {
  const { item } = props

  const survey = SurveyState.getSurvey(state)
  const appLang = AppState.getLang(state)
  const lang = Survey.getLanguage(appLang)(Survey.getSurveyInfo(survey))

  const nodeDefUuid = CollectImportReportItem.getNodeDefUuid(item)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefPath = _getNodeDefPath(survey, nodeDef, lang)

  return {
    i18n: AppState.getI18n(state),
    nodeDef,
    nodeDefPath,
    languages: Survey.getLanguages(survey),
  }
}

export default connect(mapStateToProps, { updateCollectImportReportItem })(TableRow)
