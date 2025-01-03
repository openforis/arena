import React, { useCallback, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'

import { useNodeDefByName } from '@webapp/store/survey/hooks'

import Identifier from '../identifier'
import Literal from '../literal'
import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallIncludesEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const [expressionNodeArg1, expressionNodeArg2] = expressionNode?.arguments ?? []

  const [state, setState] = useState({
    dirty: !expressionNodeArg1 || !expressionNodeArg2,
    identifierParam: expressionNodeArg1,
    literalParam: expressionNodeArg2,
  })

  const { dirty, identifierParam, literalParam } = state

  const identifierNodeDef = useNodeDefByName(identifierParam?.name)

  const onIdentifierParamChange = useCallback(
    (identifierUpdated) =>
      setState((statePrev) => ({
        ...statePrev,
        dirty: true,
        identifierParam: identifierUpdated?.name ? { type: Expression.types.Identifier, ...identifierUpdated } : null,
      })),
    []
  )

  const onLiteralParamChange = useCallback(
    (literalUpdated) =>
      setState((statePrev) => ({
        ...statePrev,
        dirty: true,
        literalParam: literalUpdated ? { type: Expression.types.Literal, ...literalUpdated } : null,
      })),
    []
  )

  const buildFunctionCall = useCallback(() => {
    const params = [identifierParam, literalParam]
    return Expression.newCall({ callee: Expression.functionNames.includes, params })
  }, [identifierParam, literalParam])

  const onConfirm = useCallback(() => {
    onConfirmProp(buildFunctionCall())
    setState((statePrev) => ({ ...statePrev, dirty: false }))
  }, [buildFunctionCall, onConfirmProp])

  return (
    <div className="function-editor">
      <FormItem label="expressionEditor.var">
        <Identifier
          node={identifierParam}
          onChange={onIdentifierParamChange}
          variables={variables}
          variablesFilterFn={(variable) =>
            variable.root || (variable.multiple && variable.nodeDefType !== NodeDef.nodeDefType.entity)
          }
        />
      </FormItem>
      {identifierNodeDef && (
        <FormItem label="common.value">
          <Literal node={literalParam} nodeDefCurrent={identifierNodeDef} onChange={onLiteralParamChange} />
        </FormItem>
      )}

      <Button disabled={!dirty || !identifierParam || !literalParam} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallIncludesEditor.propTypes = CallEditorPropTypes
