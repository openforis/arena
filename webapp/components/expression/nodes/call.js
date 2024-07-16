import './call.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { CallCategoryItemPropEditor } from './callCategoryItemPropEditor'
import { CallIncludesEditor } from './callIncludesEditor'
import { CallIsEmptyEditor } from './callIsEmptyEditor'
import { CallTaxonPropEditor } from './callTaxonPropEditor'

const functions = {
  [Expression.functionNames.isEmpty]: {
    label: 'isEmpty(...)',
    component: CallIsEmptyEditor,
  },
  [Expression.functionNames.now]: {
    label: 'now()',
    callee: 'now',
  },
  [Expression.functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
    component: CallCategoryItemPropEditor,
  },
  [Expression.functionNames.includes]: {
    label: 'includes(...)',
    component: CallIncludesEditor,
  },
  [Expression.functionNames.taxonProp]: {
    label: 'taxonProp(...)',
    component: CallTaxonPropEditor,
  },
  [Expression.functionNames.uuid]: {
    label: 'uuid()',
    callee: 'uuid',
  },
}

const Call = ({ node: expressionNode, variables, onChange }) => {
  const i18n = useI18n()

  const nodeCallee = expressionNode?.callee?.name

  const [state, setState] = useState({
    selectedFunctionKey: nodeCallee,
  })

  const { selectedFunctionKey } = state

  const emptyItem = useMemo(() => ({ value: null, label: i18n.t('common.notSpecified') }), [i18n])

  const dropdownItems = useMemo(
    () => [
      emptyItem,
      ...Object.entries(functions).map(([funcKey, func]) => ({
        value: funcKey,
        label: func.label,
        description: i18n.t(`nodeDefEdit.functionDescriptions.${funcKey}`),
      })),
    ],
    [emptyItem, i18n]
  )

  const onConfirm = useCallback((exprUpdated) => onChange(exprUpdated), [onChange])

  const onFunctionChange = useCallback(
    (item) => {
      const nextFunctionKey = item?.value

      setState((statePrev) => ({
        ...statePrev,
        selectedFunctionKey: nextFunctionKey,
      }))

      const callee = functions[nextFunctionKey]?.callee
      const component = functions[nextFunctionKey]?.component
      const newCallParams = callee && !component ? { callee } : undefined
      onChange(Expression.newCall(newCallParams))
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
