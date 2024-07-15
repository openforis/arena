import './call.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { CallCategoryItemProp } from './callCategoryItemProp'
import { CallIncludes } from './callIncludes'
import { CallIsEmpty } from './callIsEmpty'
import { CallTaxonProp } from './callTaxonProp'

const functions = {
  [Expression.functionNames.isEmpty]: {
    label: 'isEmpty(...)',
    component: CallIsEmpty,
  },
  [Expression.functionNames.now]: {
    label: 'now()',
    callee: 'now',
  },
  [Expression.functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
    component: CallCategoryItemProp,
  },
  [Expression.functionNames.includes]: {
    label: 'includes(...)',
    component: CallIncludes,
  },
  [Expression.functionNames.taxonProp]: {
    label: 'taxonProp(...)',
    component: CallTaxonProp,
  },
}

const Call = ({ node, variables, onChange }) => {
  const i18n = useI18n()

  const nodeCallee = node?.callee?.name

  const [state, setState] = useState({
    selectedFunctionKey: nodeCallee,
  })

  const { selectedFunctionKey } = state

  useEffect(() => {
    setState((statePrev) => ({ ...statePrev, selectedFunctionKey: nodeCallee }))
  }, [nodeCallee])

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

  const selectedItem = dropdownItems.find((item) => item.value === selectedFunctionKey)

  const onConfirm = useCallback((exprUpdated) => onChange(exprUpdated), [onChange])

  const selectedFunctionComponent = functions[selectedFunctionKey]?.component

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
        React.createElement(selectedFunctionComponent, { expressionNode: node, onConfirm, variables })}
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
