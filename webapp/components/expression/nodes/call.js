import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { CallCategoryItemProp } from './callCategoryItemProp'

const functions = {
  [Expression.functionNames.now]: {
    label: 'now()',
  },
  [Expression.functionNames.categoryItemProp]: {
    label: 'categoryItemProp(...)',
  },
}
const emptyItem = { value: null, label: 'common.notSpecified' }

const dropdownItems = [
  emptyItem,
  ...Object.entries(functions).map(([funcKey, func]) => ({ value: funcKey, label: func.label })),
]

const Call = ({ node, variables, onChange }) => {
  const i18n = useI18n()

  const [state, setState] = useState({
    selectedFunctionKey: node?.callee?.raw,
  })

  const { selectedFunctionKey } = state

  const selectedItem = dropdownItems.find((item) => item.value === selectedFunctionKey)

  const onConfirm = useCallback((exprUpdated) => onChange(exprUpdated), [onChange])

  return (
    <div>
      <Dropdown
        searchable={false}
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
        placeholder={i18n.t('common.function')}
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
