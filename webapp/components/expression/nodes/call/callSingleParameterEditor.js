import React, { useCallback, useState } from 'react'

import * as Expression from '@core/expressionParser/expression'

import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallSingleParameterEditor = (props) => {
  const { callee, expressionNode, onConfirm: onConfirmProp, variables, variablesFilterFn } = props

  const i18n = useI18n()
  const initialIdentifierName = expressionNode?.arguments?.[0]?.name
  const initialIdentifier = initialIdentifierName ? Expression.newIdentifier(initialIdentifierName) : null

  const [state, setState] = useState({
    identifier: initialIdentifier,
  })

  const { identifier } = state

  const createFunctionCall = useCallback(
    (identifierNext) => Expression.newCall({ callee, params: [identifierNext] }),
    [callee]
  )

  const onIdentifierChange = useCallback(
    (identifierUpdated) => {
      const identifierNext = identifierUpdated?.name
        ? { type: Expression.types.Identifier, ...identifierUpdated }
        : null
      setState((statePrev) => ({ ...statePrev, identifier: identifierNext }))
      onConfirmProp(createFunctionCall(identifierNext))
    },
    [createFunctionCall, onConfirmProp]
  )

  return (
    <FormItem label={i18n.t('expressionEditor.var')}>
      <Identifier
        node={identifier}
        onChange={onIdentifierChange}
        variables={variables}
        variablesFilterFn={variablesFilterFn}
      />
    </FormItem>
  )
}

CallSingleParameterEditor.propTypes = CallEditorPropTypes
