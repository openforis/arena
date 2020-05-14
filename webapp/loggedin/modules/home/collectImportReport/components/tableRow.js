import React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useSurvey, useI18n } from '@webapp/commonComponents/hooks'
import Checkbox from '@webapp/commonComponents/form/checkbox'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import { updateCollectImportReportItem } from '../actions'

const _getNodeDefPath = (survey, nodeDef, lang) => {
  const nodeDefPathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (def) => nodeDefPathParts.unshift(NodeDef.getLabel(def, lang)))(survey)

  return nodeDefPathParts.join(' > ')
}

const TableRow = (props) => {
  const { item, idx } = props

  const dispatch = useDispatch()
  const survey = useSurvey()
  const i18n = useI18n()
  const appLang = i18n.lang
  const surveyInfo = Survey.getSurveyInfo(survey)
  const lang = Survey.getLanguage(appLang)(surveyInfo)
  const languages = Survey.getLanguages(surveyInfo)

  const nodeDefUuid = CollectImportReportItem.getNodeDefUuid(item)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefPath = _getNodeDefPath(survey, nodeDef, lang)

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
          onChange={(checked) => dispatch(updateCollectImportReportItem(item.id, checked))}
        />
      </div>
      <div>
        <Link
          className="btn btn-transparent"
          to={`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
        >
          <span className="icon icon-12px icon-pencil2" />
        </Link>
      </div>
    </div>
  )
}

TableRow.propTypes = {
  item: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
}

export default TableRow
