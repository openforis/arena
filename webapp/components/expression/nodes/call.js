import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { CallCategoryItemProp } from './callCategoryItemProp'
import { CallIsEmpty } from './callIsEmpty'

const functions = {
  [Expression.functionNames.isEmpty]: {
    label: 'isEmpty(...)',
  },
  [Expression.functionNames.now]: {
    label: 'now()',
    callee: 'now',
  },
  [Expression.functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
  },
  [Expression.functionNames.includes]: {
    label: 'includes(...)',
  },
}

const componentsByFunction = {
  [Expression.functionNames.isEmpty]: CallIsEmpty,
  [Expression.functionNames.categoryItemProp]: CallCategoryItemProp,
  [Expression.functionNames.includes]: null,
}

const Call = ({ node, variables, onChange }) => {
  const i18n = useI18n()

  const [state, setState] = useState({
    selectedFunctionKey: node?.callee?.raw,
  })

  const emptyItem = useMemo(() => ({ value: null, label: i18n.t('common.notSpecified') }), [i18n])

  const dropdownItems = useMemo(
    () => [emptyItem, ...Object.entries(functions).map(([funcKey, func]) => ({ value: funcKey, label: func.label }))],
    [emptyItem]
  )

  const { selectedFunctionKey } = state

  const selectedItem = dropdownItems.find((item) => item.value === selectedFunctionKey)

  const onConfirm = useCallback((exprUpdated) => onChange(exprUpdated), [onChange])

  const selectedFunctionComponent = selectedFunctionKey && componentsByFunction[selectedFunctionKey]

  const onFunctionChange = useCallback(
    (item) => {
      const nextFunctionKey = item?.value

      setState((statePrev) => ({
        ...statePrev,
        selectedFunctionKey: nextFunctionKey,
        categoryUuid: null,
        extraPropKey: null,
        attributeUuidsByLevelUuid: {},
      }))

      const callee = functions[nextFunctionKey]?.callee
      const newCallParams = callee && !componentsByFunction[nextFunctionKey] ? { callee } : undefined
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
      {selectedFunctionComponent && React.createElement(selectedFunctionComponent, { onConfirm, variables })}
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
