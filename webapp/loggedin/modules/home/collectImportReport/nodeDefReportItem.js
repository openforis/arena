import React from 'react'

import CollectImportReportItem from '../../../../../common/survey/collectImportReportItem'
import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'
import Checkbox from '../../../../commonComponents/form/checkbox'
import useI18n from '../../../../commonComponents/useI18n'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

const NodeDefReportItem = props => {
  const { survey, nodeDefUuid, nodeDefItems, updateCollectImportReportItem, onNodeDefEdit } = props

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(Survey.getSurveyInfo(survey))


  return (
    <div className="collect-import-report-node-def-items">
      <div
        className="collect-import-report-node-def-items-header">{NodeDef.getLabel(nodeDef, lang)}</div>
      <div className="table__row-header collect-import-report-header">
        <div>#</div>
        <div>{i18n.t('homeView.collectImportReport.type')}</div>
        <div>{i18n.t('homeView.collectImportReport.expression')}</div>
        <div>{i18n.t('nodeDefEdit.expressionsProp.applyIf')}</div>
        <div>{i18n.t('homeView.collectImportReport.messages')}</div>
        <div>{i18n.t('homeView.collectImportReport.resolved')}</div>
        <div>{i18n.t('common.edit')}</div>
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
              <button
                className="btn btn-of-light btn-edit"
                onClick={() => { onNodeDefEdit(nodeDef) }}>
                {i18n.t('common.edit')}
              </button>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default NodeDefReportItem