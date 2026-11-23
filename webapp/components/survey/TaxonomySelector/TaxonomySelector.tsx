import { useMemo } from 'react'

import * as Taxonomy from '@core/survey/taxonomy'

import { Dropdown } from '@webapp/components/form'
import { useTaxonomies, useTaxonomyByUuid } from '@webapp/store/survey/hooks'
import type { ArenaValidation } from '@openforis/arena-core'

type TaxonomySelectorProps = {
  disabled?: boolean
  filterFunction?: (...args: any[]) => any
  onChange: (...args: any[]) => any
  selectedTaxonomyUuid?: string
  validation?: ArenaValidation
  testId?: string
}

export const TaxonomySelector = (props: TaxonomySelectorProps) => {
  const { disabled, filterFunction, onChange, selectedTaxonomyUuid, validation, testId } = props

  const taxonomies = useTaxonomies()
  const taxonomy = useTaxonomyByUuid(selectedTaxonomyUuid)

  const taxonomiesFiltered = useMemo(
    () => (filterFunction ? taxonomies.filter(filterFunction) : taxonomies),
    [filterFunction, taxonomies]
  )

  return (
    <Dropdown
      items={taxonomiesFiltered}
      itemValue="uuid"
      itemLabel={Taxonomy.getName}
      validation={validation}
      selection={taxonomy}
      disabled={disabled}
      onChange={onChange}
      testId={testId}
    />
  )
}
