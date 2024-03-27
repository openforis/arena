import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

const TaxaTableRow = (props) => {
  const { extraPropsDefsArray, idx, offset, row: taxon, vernacularLanguageCodes } = props

  const extraPropKeys = extraPropsDefsArray.map(ExtraPropDef.getName)

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{Taxon.getCode(taxon)}</div>
      <div>{Taxon.getFamily(taxon)}</div>
      <div>{Taxon.getGenus(taxon)}</div>
      <div>{Taxon.getScientificName(taxon)}</div>
      {vernacularLanguageCodes.map((lang) => {
        const vernacularNames = Taxon.getVernacularNamesByLang(lang)(taxon)
        return (
          <div key={`${Taxon.getUuid(taxon)}_vernacular_name_${lang}`}>
            {R.pipe(R.map(TaxonVernacularName.getName), R.join(TaxonVernacularName.NAMES_SEPARATOR))(vernacularNames)}
          </div>
        )
      })}
      {extraPropKeys.map((extraPropKey) => (
        <div key={`extra_prop_${extraPropKey}`}>{Taxon.getExtraProp(extraPropKey)(taxon)}</div>
      ))}
    </>
  )
}
TaxaTableRow.propTypes = {
  extraPropsDefsArray: PropTypes.array.isRequired,
  idx: PropTypes.number.isRequired,
  offset: PropTypes.number.isRequired,
  row: PropTypes.object.isRequired,
  vernacularLanguageCodes: PropTypes.array.isRequired,
}

export default TaxaTableRow
