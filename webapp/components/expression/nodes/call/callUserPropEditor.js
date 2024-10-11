import React, { useCallback, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'

import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallUserPropEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp } = props

  const initialValue = expressionNode?.arguments?.[0]?.value

  const [value, setValue] = useState(initialValue)

  const createFunctionCall = useCallback(
    (valueUpdated) =>
      Expression.newCall({ callee: Expression.functionNames.userProp, params: [Expression.newLiteral(valueUpdated)] }),
    []
  )

  const onValueChange = useCallback((valueUpdated) => setValue(valueUpdated), [])

  const onConfirm = useCallback(() => {
    if (Objects.isNotEmpty(value)) {
      onConfirmProp(createFunctionCall(value))
    }
  }, [createFunctionCall, onConfirmProp, value])

  return (
    <div className="function-editor">
      <FormItem label="extraProp.label">
        <Input onChange={onValueChange} textTransformFunction={StringUtils.normalizeName} value={value} />
      </FormItem>
      <Button disabled={Objects.isEmpty(value)} label="common.ok" onClick={onConfirm} />
    </div>
  )
}

CallUserPropEditor.propTypes = CallEditorPropTypes
