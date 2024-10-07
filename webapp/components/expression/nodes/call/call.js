import './call.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { ButtonIconEdit } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { functions, getComplexFunctionNameByExpression } from './functions'
import { CallEditorDialog } from './callEditorDialog'

const Call = (props) => {
  const { node: expressionNode, variables, onChange } = props

  const i18n = useI18n()

  const nodeCallee = expressionNode?.callee?.name
  const exprString = expressionNode ? Expression.toString(expressionNode) : null
  const complexFunctionName = getComplexFunctionNameByExpression(exprString)

  const [state, setState] = useState({
    selectedFunctionKey: complexFunctionName ?? nodeCallee,
    editDialogOpen: false,
  })

  const { selectedFunctionKey, editDialogOpen } = state

  const dropdownItems = useMemo(
    () =>
      Object.entries(functions).map(([funcKey, func]) => ({
        value: funcKey,
        label: func.label ?? i18n.t(func.labelKey),
        description: i18n.t(`nodeDefEdit.functionDescriptions.${funcKey}`),
      })),
    [i18n]
  )

  const openEditDialog = useCallback(() => setState((statePrev) => ({ ...statePrev, editDialogOpen: true })), [])
  const closeEditDialog = useCallback(() => setState((statePrev) => ({ ...statePrev, editDialogOpen: false })), [])

  const onConfirm = useCallback(
    (exprUpdated) => {
      onChange(exprUpdated)
      closeEditDialog()
    },
    [closeEditDialog, onChange]
  )

  const onFunctionChange = useCallback(
    (item) => {
      const nextFunctionKey = item?.value

      const { callee, component, exprString } = functions[nextFunctionKey] ?? {}
      let expressionNext = null
      if (exprString) {
        expressionNext = Expression.fromString(exprString)
      } else {
        const newCallParams = callee && !component ? { callee } : undefined
        expressionNext = Expression.newCall(newCallParams)
      }
      onChange(expressionNext)

      setState((statePrev) => ({
        ...statePrev,
        selectedFunctionKey: nextFunctionKey,
        editDialogOpen: !!component,
      }))
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
        placeholder={i18n.t('expressionEditor.selectAFunction')}
        searchable={false}
        selection={selectedItem}
      />
      {selectedItem && selectedFunctionComponent && <ButtonIconEdit onClick={openEditDialog} />}
      {editDialogOpen && (
        <CallEditorDialog functionName={selectedItem.label} onClose={closeEditDialog}>
          {selectedFunctionComponent &&
            React.createElement(selectedFunctionComponent, { expressionNode, onConfirm, variables })}
        </CallEditorDialog>
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
