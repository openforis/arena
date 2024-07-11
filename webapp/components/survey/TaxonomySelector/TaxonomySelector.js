import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Taxonomy from '@core/survey/taxonomy'

import { Dropdown } from '@webapp/components/form'
import { useTaxonomies, useTaxonomyByUuid } from '@webapp/store/survey/hooks'

export const TaxonomySelector = (props) => {
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

TaxonomySelector.propTypes = {
  disabled: PropTypes.bool,
  filterFunction: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  selectedTaxonomyUuid: PropTypes.string,
  validation: PropTypes.object,
  testId: PropTypes.string,
}
