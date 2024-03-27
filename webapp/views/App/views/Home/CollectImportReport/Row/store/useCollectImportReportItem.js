import React, { useState } from 'react'

import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useOnUpdate } from '@webapp/components/hooks'
import { useSurvey, useSurveyLangs } from '@webapp/store/survey'
import { useI18n, useLang } from '@webapp/store/system'

import { useActions } from './actions/index'

const _isValidationRule = (type) =>
  type === CollectImportReportItem.exprTypes.validationRuleError ||
  type === CollectImportReportItem.exprTypes.validationRuleWarning

const _getTypeIcon = (type) => {
  if (_isValidationRule(type)) {
    const severity = type === CollectImportReportItem.exprTypes.validationRuleError ? 'error' : 'warning'
    return <span className={`icon icon-12px icon-left icon-warning ${severity}`} />
  }
  return null
}

const useTypeWithIcon = ({ item }) => {
  const type = CollectImportReportItem.getExpressionType(item)
  const i18n = useI18n()

  return {
    type,
    icon: _getTypeIcon(type),
    label: _isValidationRule(type)
      ? i18n.t(`homeView.collectImportReport.exprType.validationRule`)
      : i18n.t(`homeView.collectImportReport.exprType.${type}`),
  }
}

const useNodeDef = ({ item, survey }) => {
  const nodeDefUuid = CollectImportReportItem.getNodeDefUuid(item)
  return Survey.getNodeDefByUuid(nodeDefUuid)(survey)
}

const useNodeDefPath = ({ item, survey }) => {
  const lang = useLang()
  const nodeDef = useNodeDef({ item, survey })
  const nodeDefPathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (def) => nodeDefPathParts.unshift(NodeDef.getLabel(def, lang)))(survey)
  return nodeDefPathParts.join(' > ')
}

export const useCollectImportReportItem = ({ row, rowNo }) => {
  const [rowItem, setRowItem] = useState({ rowNo, ...row })

  const survey = useSurvey()
  const languages = useSurveyLangs()

  const { onUpdate } = useActions({ rowItem, setRowItem })

  const type = useTypeWithIcon({ item: rowItem })
  const nodeDefPath = useNodeDefPath({ item: rowItem, survey })
  const nodeDef = useNodeDef({ item: rowItem, survey })

  useOnUpdate(() => {
    setRowItem({ rowNo, ...row })
  }, [row])

  return {
    rowNo,
    row: rowItem,
    type,
    nodeDefPath,
    nodeDef,
    languages,
    onUpdate,
  }
}
