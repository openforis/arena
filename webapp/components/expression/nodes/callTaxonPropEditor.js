import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import { Strings } from '@openforis/arena-core'

import * as Expression from '@core/expressionParser/expression'
import * as Taxonomy from '@core/survey/taxonomy'

import { Button } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { TaxonomySelector } from '@webapp/components/survey/TaxonomySelector'
import Identifier from './identifier'
import { useTaxonomyByUuid } from '@webapp/store/survey/hooks'

export const CallTaxonPropEditor = (props) => {
  const { onConfirm: onConfirmProp, variables } = props

  const i18n = useI18n()

  const [state, setState] = useState({
    taxonomyUuid: null,
    extraPropKey: null,
    identifier: null,
  })

  const { taxonomyUuid, extraPropKey, identifier } = state

  const taxonomy = useTaxonomyByUuid(taxonomyUuid)

  const onIdentifierChange = useCallback((identifierUpdated) => {
    setState((statePrev) => ({
      ...statePrev,
      dirty: true,
      identifier: identifierUpdated?.name ? { type: Expression.types.Identifier, ...identifierUpdated } : null,
    }))
  }, [])

  const buildTaxonPropCall = useCallback(() => {
    const params = [
      Expression.newLiteral(Strings.quote(Taxonomy.getName(taxonomy))),
      Expression.newLiteral(Strings.quote(extraPropKey)),
      identifier,
    ]
    return Expression.newCall({ callee: Expression.functionNames.taxonProp, params })
  }, [taxonomy, extraPropKey, identifier])

  const onConfirm = useCallback(() => onConfirmProp(buildTaxonPropCall()), [buildTaxonPropCall, onConfirmProp])

  const applyButtonDisabled = !taxonomy || !extraPropKey || !identifier

  return (
    <div className="call-category-item-prop">
      <FormItem label={i18n.t('taxonomy.header')}>
        <TaxonomySelector
          filterFunction={Taxonomy.hasExtraDefs}
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              taxonomyUuid: Taxonomy.getUuid(item),
              extraPropKey: null,
            }))
          }}
          selectedTaxonomyUuid={taxonomyUuid}
        />
      </FormItem>
      <FormItem label={i18n.t('extraProp.label')}>
        <Dropdown
          disabled={!taxonomyUuid}
          items={Taxonomy.getExtraPropKeys(taxonomy)}
          itemLabel={(item) => item}
          itemValue={(item) => item}
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              extraPropKey: item,
            }))
          }}
          selection={extraPropKey}
        />
      </FormItem>

      <FormItem label={i18n.t('expressionEditor.var')}>
        <Identifier node={identifier} onChange={onIdentifierChange} variables={variables} />
      </FormItem>

      <Button disabled={applyButtonDisabled} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallTaxonPropEditor.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
