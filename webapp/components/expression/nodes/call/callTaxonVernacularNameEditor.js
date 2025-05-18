import React, { useCallback, useState } from 'react'

import { Strings } from '@openforis/arena-core'

import * as Expression from '@core/expressionParser/expression'
import * as Taxonomy from '@core/survey/taxonomy'
import * as StringUtils from '@core/stringUtils'

import { Button } from '@webapp/components/buttons'
import { LanguageDropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { TaxonomySelector } from '@webapp/components/survey/TaxonomySelector'
import { useTaxonomyByName, useTaxonomyByUuid } from '@webapp/store/survey/hooks'

import Identifier from '../identifier'
import { CallEditorPropTypes } from './callEditorPropTypes'
import { standards } from '@core/app/languages'

const createInitialState = ({ initialTaxonomy, initialVernacularLangCode, initialIdentifierName }) => {
  const initialIdentifier = initialIdentifierName ? Expression.newIdentifier(initialIdentifierName) : null
  return {
    taxonomyUuid: Taxonomy.getUuid(initialTaxonomy),
    vernacularLangCode: initialVernacularLangCode,
    identifier: initialIdentifier,
  }
}

export const CallTaxonVernacularNameEditor = (props) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const expressionArgumentsValues =
    expressionNode?.arguments?.map((arg) => arg.value ?? arg.name).map(StringUtils.unquote) ?? []
  const [initialTaxonomyName, initialVernacularLangCode, initialIdentifierName] = expressionArgumentsValues

  const initialTaxonomy = useTaxonomyByName(initialTaxonomyName)

  const initialState = createInitialState({ initialTaxonomy, initialVernacularLangCode, initialIdentifierName })

  const [state, setState] = useState(initialState)

  const { taxonomyUuid, vernacularLangCode, identifier } = state

  const taxonomy = useTaxonomyByUuid(taxonomyUuid)

  const onIdentifierChange = useCallback((identifierUpdated) => {
    setState((statePrev) => ({
      ...statePrev,
      dirty: true,
      identifier: identifierUpdated?.name ? { type: Expression.types.Identifier, ...identifierUpdated } : null,
    }))
  }, [])

  const buildTaxonVernacularNameCall = useCallback(() => {
    const params = [
      Expression.newLiteral(Strings.quote(Taxonomy.getName(taxonomy))),
      Expression.newLiteral(Strings.quote(vernacularLangCode)),
      identifier,
    ]
    return Expression.newCall({ callee: Expression.functionNames.taxonVernacularName, params })
  }, [taxonomy, vernacularLangCode, identifier])

  const onConfirm = useCallback(
    () => onConfirmProp(buildTaxonVernacularNameCall()),
    [buildTaxonVernacularNameCall, onConfirmProp]
  )

  const applyButtonDisabled = !taxonomy || !vernacularLangCode || !identifier

  return (
    <div className="function-editor">
      <FormItem label="taxonomy.header">
        <TaxonomySelector
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              taxonomyUuid: Taxonomy.getUuid(item),
              vernacularLangCode: null,
              identifier: null,
            }))
          }}
          selectedTaxonomyUuid={taxonomyUuid}
        />
      </FormItem>
      <FormItem label="taxonomy.vernacularLanguage">
        <LanguageDropdown
          disabled={!taxonomyUuid}
          standard={standards.ISO_639_2}
          onChange={(langCode) => {
            setState((statePrev) => ({
              ...statePrev,
              vernacularLangCode: langCode,
            }))
          }}
          selection={vernacularLangCode}
        />
      </FormItem>

      <FormItem label="expressionEditor.var">
        <Identifier disabled={!taxonomyUuid} node={identifier} onChange={onIdentifierChange} variables={variables} />
      </FormItem>

      <Button disabled={applyButtonDisabled} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallTaxonVernacularNameEditor.propTypes = CallEditorPropTypes
