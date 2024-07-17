import './call.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { CallCategoryItemPropEditor } from './callCategoryItemPropEditor'
import { CallCountEditor } from './callCountEditor'
import { CallIncludesEditor } from './callIncludesEditor'
import { CallIsEmptyEditor } from './callIsEmptyEditor'
import { CallIsNotEmptyEditor } from './callIsNotEmptyEditor'
import { CallTaxonPropEditor } from './callTaxonPropEditor'

const complexFunctions = {
  rowIndex: {
    labelKey: 'nodeDefEdit.functionName.rowIndex',
    exprString: 'index($context)',
  },
}

const getComplextFunctionNameByExpression = (exprString) => {
  if (!exprString) return null
  return Object.keys(complexFunctions).find((key) => {
    const funcObj = complexFunctions[key]
    return funcObj.exprString === exprString
  })
}

const functions = {
  [Expression.functionNames.isEmpty]: {
    label: 'isEmpty(...)',
    component: CallIsEmptyEditor,
  },
  [Expression.functionNames.isNotEmpty]: {
    label: 'isNotEmpty(...)',
    component: CallIsNotEmptyEditor,
  },
  [Expression.functionNames.count]: {
    label: 'count(...)',
    component: CallCountEditor,
  },
  [Expression.functionNames.includes]: {
    label: 'includes(...)',
    component: CallIncludesEditor,
  },
  [Expression.functionNames.now]: {
    label: 'now()',
    callee: Expression.functionNames.now,
  },
  [Expression.functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
    component: CallCategoryItemPropEditor,
  },
  [Expression.functionNames.taxonProp]: {
    label: 'taxonProp(...)',
    component: CallTaxonPropEditor,
  },
  [Expression.functionNames.uuid]: {
    label: 'uuid()',
    callee: Expression.functionNames.uuid,
  },
  ...complexFunctions,
}

const Call = (props) => {
  const { node: expressionNode, variables, onChange } = props

  const i18n = useI18n()

  const nodeCallee = expressionNode?.callee?.name
  const exprString = expressionNode ? Expression.toString(expressionNode) : null
  const complexFunctionName = getComplextFunctionNameByExpression(exprString)

  const [state, setState] = useState({
    selectedFunctionKey: complexFunctionName ?? nodeCallee,
  })

  const { selectedFunctionKey } = state

  const dropdownItems = useMemo(
    () =>
      Object.entries(functions).map(([funcKey, func]) => ({
        value: funcKey,
        label: func.label ?? i18n.t(func.labelKey),
        description: i18n.t(`nodeDefEdit.functionDescriptions.${funcKey}`),
      })),
    [i18n]
  )

  const onConfirm = useCallback((exprUpdated) => onChange(exprUpdated), [onChange])

  const onFunctionChange = useCallback(
    (item) => {
      const nextFunctionKey = item?.value

      setState((statePrev) => ({
        ...statePrev,
        selectedFunctionKey: nextFunctionKey,
      }))

      const { callee, component, exprString } = functions[nextFunctionKey] ?? {}
      let expressionNext = null
      if (exprString) {
        expressionNext = Expression.fromString(exprString)
      } else {
        const newCallParams = callee && !component ? { callee } : undefined
        expressionNext = Expression.newCall(newCallParams)
      }
      onChange(expressionNext)
    },
    [onChange]
  )

  const selectedItem = dropdownItems.find((item) => item.value === selectedFunctionKey)
  const selectedFunctionComponent = functions[selectedFunctionKey]?.component

  return (
    <div className="call">
      <Dropdown
        className="function-dropdown"
        items={dropdownItems}
        onChange={onFunctionChange}
        placeholder={i18n.t('common.selectOne')}
        searchable={false}
        selection={selectedItem}
      />
      {selectedFunctionComponent &&
        React.createElement(selectedFunctionComponent, { expressionNode, onConfirm, variables })}
    </div>
  )
}

Call.propTypes = {
  // Common props
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array.isRequired,
}

export default Call
