import React from 'react'

import CollectImportReportItem from '../../../../../common/survey/collectImportReportItem'
import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'
import Checkbox from '../../../../commonComponents/form/checkbox'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

const NodeDefReportItem = props => {
  const { survey, nodeDefUuid, nodeDefItems, updateCollectImportReportItem, onNodeDefEdit } = props

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const defaultLanguage = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return (
    <div className="collect-import-report-node-def-items">
      <div
        className="collect-import-report-node-def-items-header">{NodeDef.getLabel(nodeDef, defaultLanguage)}</div>
      <div className="table__row-header collect-import-report-header">
        <div>#</div>
        <div>Type</div>
        <div>Expression</div>
        <div>Apply if</div>
        <div>Messages</div>
        <div>Resolved</div>
        <div>Edit</div>
      </div>
      {
        nodeDefItems.map((item, idx) =>
          <div
            key={idx}
            className="table__row collect-import-report-item">
            <div>{idx + 1}</div>
            <div>{CollectImportReportItem.getExpressionType(item)}</div>
            <div>{CollectImportReportItem.getExpression(item)}</div>
            <div>{CollectImportReportItem.getApplyIf(item)}</div>
            <div>
              <LabelsEditor
                labels={CollectImportReportItem.getMessages(item)}
                languages={Survey.getLanguages(survey)}
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
              <button onClick={() => {
                onNodeDefEdit(nodeDef)
              }}>EDIT
              </button>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default NodeDefReportItem