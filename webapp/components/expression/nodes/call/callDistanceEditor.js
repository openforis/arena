import React, { useCallback, useState } from 'react'

import { Arrays } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'

const variablesFilterFn = (variable) => variable.root || variable.nodeDefType === NodeDef.nodeDefType.coordinate

export const CallDistanceEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const identifierArguments = expressionNode?.arguments ?? []

  const [state, setState] = useState({
    dirty: !identifierArguments?.[0] || !identifierArguments?.[1],
    identifierParams: identifierArguments,
  })

  const { dirty, identifierParams } = state

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
    return Expression.newCall({ callee: Expression.functionNames.distance, params })
  }, [identifierParams])

  const onConfirm = useCallback(() => {
    onConfirmProp(buildFunctionCall())
    setState((statePrev) => ({ ...statePrev, dirty: false }))
  }, [buildFunctionCall, onConfirmProp])

  return (
    <div className="function-editor">
      {Arrays.fromNumberOfElements(2).map((v, index) => (
        <FormItem
          key={String(v)}
          label="expressionEditor.coordinateAttributeWithPosition"
          labelParams={{ position: index + 1 }}
        >
          <Identifier
            node={identifierParams[index]}
            onChange={onIdentifierParamChange(index)}
            variables={variables}
            variablesFilterFn={variablesFilterFn}
          />
        </FormItem>
      ))}

      <Button
        disabled={!dirty || !identifierParams[0] || !identifierParams[1]}
        label="common.apply"
        onClick={onConfirm}
      />
    </div>
  )
}

CallDistanceEditor.propTypes = CallEditorPropTypes
