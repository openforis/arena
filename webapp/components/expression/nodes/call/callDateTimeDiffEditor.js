import React, { useCallback, useState } from 'react'

import { Arrays, Objects } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'

const dateVariablesFilterFn = (variable) => variable.root || variable.nodeDefType === NodeDef.nodeDefType.date
const timeVariablesFilterFn = (variable) => variable.root || variable.nodeDefType === NodeDef.nodeDefType.time

const callee = Expression.functionNames.dateTimeDiff
const labelPrefix = 'expressionEditor.dateTimeDiffEditor.'

const labelByParameterIndex = [
  'firstDateAttribute',
  'firstTimeAttribute',
  'secondDateAttribute',
  'secondTimeAttribute',
].map((label) => `${labelPrefix}${label}`)

export const CallDateTimeDiffEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const identifierArguments = expressionNode?.arguments ?? []

  const hasSomeEmptyArguments = identifierArguments.length < 4 || identifierArguments.some(Objects.isEmpty)

  const [state, setState] = useState({
    dirty: hasSomeEmptyArguments,
    identifierParams: identifierArguments,
  })

  const { dirty, identifierParams } = state

  const hasSomeEmptyParameters = identifierParams.length < 4 || identifierParams.some(Objects.isEmpty)

  const onIdentifierParamChange = useCallback(
    (paramIndex) => (identifierUpdated) =>
      setState((statePrev) => {
        const identifierParamsUpdated = [...statePrev.identifierParams]
        const identifierParamUpdated = identifierUpdated?.name
          ? { type: Expression.types.Identifier, ...identifierUpdated }
          : null
        identifierParamsUpdated[paramIndex] = identifierParamUpdated
        return {
          ...statePrev,
          dirty: true,
          identifierParams: identifierParamsUpdated,
        }
      }),
    []
  )

  const buildFunctionCall = useCallback(() => {
    const params = identifierParams
    return Expression.newCall({ callee, params })
  }, [identifierParams])

  const onConfirm = useCallback(() => {
    onConfirmProp(buildFunctionCall())
    setState((statePrev) => ({ ...statePrev, dirty: false }))
  }, [buildFunctionCall, onConfirmProp])

  return (
    <div className="function-editor">
      {Arrays.fromNumberOfElements(4).map((paramIndex) => (
        <FormItem key={String(paramIndex)} label={labelByParameterIndex[paramIndex]}>
          <Identifier
            node={identifierParams[paramIndex]}
            onChange={onIdentifierParamChange(paramIndex)}
            variables={variables}
            variablesFilterFn={paramIndex % 2 === 0 ? dateVariablesFilterFn : timeVariablesFilterFn}
          />
        </FormItem>
      ))}

      <Button disabled={!dirty || hasSomeEmptyParameters} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallDateTimeDiffEditor.propTypes = CallEditorPropTypes
