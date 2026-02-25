import React, { useCallback, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'

const coordinateVarFilterFn = (variable) => variable.root || NodeDef.nodeDefType.coordinate === variable.nodeDefType
const numericVarFilterFn = (variable) =>
  variable.root || [NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer].includes(variable.nodeDefType)

export const CallGeoLocationAtDistanceEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const identifierArguments = expressionNode?.arguments ?? []

  const [state, setState] = useState({
    dirty: !identifierArguments?.[0] || !identifierArguments?.[1] || !identifierArguments?.[2],
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
    return Expression.newCall({ callee: Expression.functionNames.geoLocationAtDistance, params })
  }, [identifierParams])

  const onConfirm = useCallback(() => {
    onConfirmProp(buildFunctionCall())
    setState((statePrev) => ({ ...statePrev, dirty: false }))
  }, [buildFunctionCall, onConfirmProp])

  return (
    <div className="function-editor">
      <FormItem label="expressionEditor.geoLocationAtDistanceEditor.coordinateAttributeOrigin">
        <Identifier
          node={identifierParams[0]}
          onChange={onIdentifierParamChange(0)}
          variables={variables}
          variablesFilterFn={coordinateVarFilterFn}
        />
      </FormItem>
      <FormItem label="expressionEditor.geoLocationAtDistanceEditor.distanceAttribute">
        <Identifier
          node={identifierParams[1]}
          onChange={onIdentifierParamChange(1)}
          variables={variables}
          variablesFilterFn={numericVarFilterFn}
        />
      </FormItem>
      <FormItem label="expressionEditor.geoLocationAtDistanceEditor.bearingAttribute">
        <Identifier
          node={identifierParams[2]}
          onChange={onIdentifierParamChange(2)}
          variables={variables}
          variablesFilterFn={numericVarFilterFn}
        />
      </FormItem>
      <Button
        disabled={!dirty || !identifierParams[0] || !identifierParams[1] || !identifierParams[2]}
        label="common.apply"
        onClick={onConfirm}
      />
    </div>
  )
}

CallGeoLocationAtDistanceEditor.propTypes = CallEditorPropTypes
