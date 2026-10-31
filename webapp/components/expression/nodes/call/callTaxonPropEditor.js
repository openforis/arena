import React, { useCallback, useMemo, useState } from 'react'

import { Strings } from '@openforis/arena-core'

import { getLanguageISO639part2Label } from '@core/app/languages'
import * as Expression from '@core/expressionParser/expression'
import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
import * as StringUtils from '@core/stringUtils'

import { Button } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { TaxonomySelector } from '@webapp/components/survey/TaxonomySelector'
import { useTaxonomyByName, useTaxonomyByUuid } from '@webapp/store/survey/hooks'
import { useI18n } from '@webapp/store/system'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'

const standardPropKeys = [
  Taxon.propKeys.code,
  Taxon.propKeys.family,
  Taxon.propKeys.genus,
  Taxon.propKeys.scientificName,
]

const standardPropLabelKeys = {
  [Taxon.propKeys.code]: 'common.code',
  [Taxon.propKeys.family]: 'taxonomy.edit.family',
  [Taxon.propKeys.genus]: 'taxonomy.edit.genus',
  [Taxon.propKeys.scientificName]: 'taxonomy.edit.scientificName',
}

// Standard props, vernacular names (by language code) and extra props of the taxonomy.
const buildPropItems = ({ taxonomy, i18n }) => [
  ...standardPropKeys.map((key) => ({ value: key, label: `${key} (${i18n.t(standardPropLabelKeys[key])})` })),
  ...Taxonomy.getVernacularLanguageCodes(taxonomy).map((langCode) => ({
    value: langCode,
    label: `${langCode} (${getLanguageISO639part2Label(langCode) ?? langCode})`,
  })),
  ...Taxonomy.getExtraPropKeys(taxonomy).map((key) => ({ value: key, label: key })),
]

const createInitialState = ({ initialTaxonomy, initialExtraPropKey, initialIdentifierName }) => {
  const initialIdentifier = initialIdentifierName ? Expression.newIdentifier(initialIdentifierName) : null
  return {
    taxonomyUuid: Taxonomy.getUuid(initialTaxonomy),
    extraPropKey: initialExtraPropKey,
    identifier: initialIdentifier,
  }
}

export const CallTaxonPropEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const i18n = useI18n()

  const expressionArgumentsValues =
    expressionNode?.arguments?.map((arg) => arg.value ?? arg.name).map(StringUtils.unquote) ?? []
  const [initialTaxonomyName, initialExtraPropKey, initialIdentifierName] = expressionArgumentsValues

  const initialTaxonomy = useTaxonomyByName(initialTaxonomyName)

  const initialState = createInitialState({ initialTaxonomy, initialExtraPropKey, initialIdentifierName })

  const [state, setState] = useState(initialState)

  const { taxonomyUuid, extraPropKey, identifier } = state

  const taxonomy = useTaxonomyByUuid(taxonomyUuid)

  const propItems = useMemo(() => (taxonomy ? buildPropItems({ taxonomy, i18n }) : []), [i18n, taxonomy])
  const selectedPropItem = extraPropKey
    ? (propItems.find((item) => item.value === extraPropKey) ?? { value: extraPropKey, label: extraPropKey })
    : null

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
    <div className="function-editor">
      <FormItem label="taxonomy.header">
        <TaxonomySelector
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              taxonomyUuid: Taxonomy.getUuid(item),
              extraPropKey: null,
              identifier: null,
            }))
          }}
          selectedTaxonomyUuid={taxonomyUuid}
        />
      </FormItem>
      <FormItem label="expressionEditor.taxonProp">
        <Dropdown
          disabled={!taxonomyUuid}
          items={propItems}
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              extraPropKey: item?.value ?? null,
            }))
          }}
          selection={selectedPropItem}
        />
      </FormItem>

      <FormItem label="expressionEditor.var">
        <Identifier disabled={!taxonomyUuid} node={identifier} onChange={onIdentifierChange} variables={variables} />
      </FormItem>

      <Button disabled={applyButtonDisabled} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallTaxonPropEditor.propTypes = CallEditorPropTypes
