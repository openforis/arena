import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { CallCategoryItemProp } from './callCategoryItemProp'

const functions = {
  [Expression.functionNames.isEmpty]: {
    label: 'isEmpty(...)',
  },
  [Expression.functionNames.now]: {
    label: 'now()',
  },
  [Expression.functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
  },
  [Expression.functionNames.includes]: {
    label: 'includes(...)',
  },
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

  return (
    <div>
      <Dropdown
        items={dropdownItems}
        onChange={(item) => {
          setState((statePrev) => ({
            ...statePrev,
            selectedFunctionKey: item?.value,
            categoryUuid: null,
            extraPropKey: null,
            attributeUuidsByLevelUuid: {},
          }))
        }}
        placeholder={i18n.t('common.selectOne')}
        searchable={false}
        selection={selectedItem}
      />
      {selectedFunctionKey === Expression.functionNames.categoryItemProp && (
        <CallCategoryItemProp onConfirm={onConfirm} variables={variables} />
      )}
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
