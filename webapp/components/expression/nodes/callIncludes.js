import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'

import { useNodeDefByName } from '@webapp/store/survey/hooks'
import { useI18n } from '@webapp/store/system'

import Identifier from './identifier'
import Literal from './literal'

export const CallIncludes = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const i18n = useI18n()

  const { arguments: expressionNodeArgs = [] } = expressionNode ?? {}
  const [expressionFirstArg, expressionSecondArg] = expressionNodeArgs

  const [state, setState] = useState({
    dirty: !expressionFirstArg || !expressionSecondArg,
    identifierParam: expressionFirstArg,
    literalParam: expressionSecondArg,
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
      <FormItem label={i18n.t('expressionEditor.var')}>
        <Identifier
          variablesFilterFn={() => true}
          node={identifierParam}
          onChange={onIdentifierParamChange}
          variables={variables}
        />
      </FormItem>
      {identifierNodeDef && (
        <FormItem label={i18n.t('common.value')}>
          <Literal node={literalParam} nodeDefCurrent={identifierNodeDef} onChange={onLiteralParamChange} />
        </FormItem>
      )}

      <Button disabled={!dirty || !identifierParam || !literalParam} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallIncludes.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
