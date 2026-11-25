import ReactDOM from 'react-dom'
import type React from 'react'

import type { ArenaAnyNodeDef, ArenaRecordNode, ArenaTaxon } from '@openforis/arena-core'

import * as Taxon from '@core/survey/taxon'
import AutocompleteDialog from '@webapp/components/form/AutocompleteDialog'

import { useTaxa } from './useTaxa'

type NodeDefTaxonAutocompleteItemRendererProps = {
  item: ArenaTaxon
  onKeyDown?: (...args: any[]) => any
  onMouseDown?: (...args: any[]) => any
}

const NodeDefTaxonAutocompleteItemRenderer = (props: NodeDefTaxonAutocompleteItemRendererProps) => {
  const { item: taxon, onKeyDown, onMouseDown } = props

  const vernacularLang = Taxon.getVernacularLanguage(taxon)

  return (
    <button key={Taxon.getUuid(taxon)} className="item" onKeyDown={onKeyDown} onMouseDown={onMouseDown} type="button">
      <div>{Taxon.getCode(taxon)}</div>
      <div>{Taxon.getScientificName(taxon)}</div>
      {vernacularLang && <div style={{ gridColumn: 2 }}>{`${Taxon.getVernacularName(taxon)} (${vernacularLang})`}</div>}
    </button>
  )
}

type NodeDefTaxonAutocompleteDialogProps = {
  autocompleteSourceElement: React.ReactNode // Used as sourceElement for the autocompleteDialog when rendered in tableBody
  draft?: boolean
  entryDataQuery?: boolean
  field?: string
  fieldValue?: string
  inputRef: Record<string, any>
  nodeDef: ArenaAnyNodeDef
  onItemSelect: (...args: any[]) => any
  onClose: (...args: any[]) => any
  parentNode: ArenaRecordNode
}

const NodeDefTaxonAutocompleteDialog = (props: NodeDefTaxonAutocompleteDialogProps) => {
  const {
    autocompleteSourceElement,
    draft = false,
    entryDataQuery,
    field = '',
    fieldValue = '',
    inputRef,
    nodeDef,
    onItemSelect,
    onClose,
    parentNode,
  } = props

  const taxa = useTaxa({ nodeDef, parentNode, draft, entryDataQuery, field, fieldValue })

  // inside a modal (e.g. the edit dialog of a multiple attribute in a table) the list must be above it
  // eslint-disable-next-line react-hooks/refs -- rendered only after a change event of the input, so the ref is set
  const container = inputRef.current?.closest('.modal') ?? document.body

  return ReactDOM.createPortal(
    <AutocompleteDialog
      className="survey-form__node-def-taxon-autocomplete-list"
      items={taxa}
      itemRenderer={NodeDefTaxonAutocompleteItemRenderer}
      itemKey={(taxon) => `${Taxon.getUuid(taxon)}_${Taxon.getVernacularNameUuid(taxon)}`}
      // eslint-disable-next-line react-hooks/refs -- rendered only after a change event of the input, so the ref is set
      inputField={inputRef.current}
      onItemSelect={onItemSelect}
      onClose={onClose}
      sourceElement={autocompleteSourceElement}
    />,
    container
  )
}

export default NodeDefTaxonAutocompleteDialog
