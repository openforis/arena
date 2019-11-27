import React from 'react'
import * as R from 'ramda'

import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

const TaxaTableRow = props => {
  const {row: taxon, idx, offset, vernacularLanguageCodes} = props

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{Taxon.getCode(taxon)}</div>
      <div>{Taxon.getFamily(taxon)}</div>
      <div>{Taxon.getGenus(taxon)}</div>
      <div>{Taxon.getScientificName(taxon)}</div>
      {vernacularLanguageCodes.map(lang => {
        const vernacularNames = Taxon.getVernacularNamesByLang(lang)(taxon)
        return (
          <div key={`${Taxon.getUuid(taxon)}_vernacular_name_${lang}`}>
            {R.pipe(
              R.map(TaxonVernacularName.getName),
              R.join(TaxonVernacularName.NAMES_SEPARATOR),
            )(vernacularNames)}
          </div>
        )
      })}
    </>
  )
}

export default TaxaTableRow
