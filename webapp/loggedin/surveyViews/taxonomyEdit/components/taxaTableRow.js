import React from 'react'

import Taxon from '@core/survey/taxon'

const TaxaTableRow = props => {

  const { row, idx, offset, vernacularLanguageCodes } = props

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{Taxon.getCode(row)}</div>
      <div>{Taxon.getFamily(row)}</div>
      <div>{Taxon.getGenus(row)}</div>
      <div>{Taxon.getScientificName(row)}</div>
      {
        vernacularLanguageCodes.map(lang =>
          <div key={`vernacular_name_${Taxon.getUuid(row)}_${lang}`}>
            {Taxon.getVernacularName(lang)(row)}
          </div>
        )
      }
    </>
  )
}

export default TaxaTableRow