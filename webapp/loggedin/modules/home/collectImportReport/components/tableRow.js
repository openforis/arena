import React from 'react'
import { connect } from 'react-redux'

import Survey from '@core/survey/survey'
import NodeDef from '@core/survey/nodeDef'
import CollectImportReportItem from '@core/survey/collectImportReportItem'

import LabelsEditor from '../../../../surveyViews/labelsEditor/labelsEditor'
import Checkbox from '@webapp/commonComponents/form/checkbox'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

import { updateCollectImportReportItem } from '../actions'
import { setNodeDefForEdit } from '../../../../surveyViews/nodeDefEdit/actions'

const TableRow = props => {
  const {
    item, idx,
    nodeDef, nodeDefPath, languages,
    updateCollectImportReportItem, setNodeDefForEdit
  } = props

  return (
    <div
      key={idx}
      className="table__row">
      <div>{idx + 1}</div>
      <div>{nodeDefPath}</div>
      <div>{CollectImportReportItem.getExpressionType(item)}</div>
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
        <a className=""
           onClick={() => { setNodeDefForEdit(nodeDef) }}>
          <span className="icon icon-12px icon-pencil2"/>
        </a>
      </div>
    </div>
  )
}

const _getNodeDefPath = (survey, nodeDef, lang) => {
  const nodeDefPathParts = []
  Survey.visitAncestorsAndSelf(
    nodeDef,
    def => nodeDefPathParts.unshift(NodeDef.getLabel(def, lang))
  )(survey)

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
    nodeDef,
    nodeDefPath,
    languages: Survey.getLanguages(survey),
  }
}

export default connect(
  mapStateToProps,
  { updateCollectImportReportItem, setNodeDefForEdit }
)(TableRow)