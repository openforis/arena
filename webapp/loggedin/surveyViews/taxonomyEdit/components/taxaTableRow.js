import React from 'react'

import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

const TaxaTableRow = props => {

  const { row: taxon, idx, offset, vernacularLanguageCodes } = props

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{Taxon.getCode(taxon)}</div>
      <div>{Taxon.getFamily(taxon)}</div>
      <div>{Taxon.getGenus(taxon)}</div>
      <div>{Taxon.getScientificName(taxon)}</div>
      {
        vernacularLanguageCodes.map(lang => {
            const vernacularName = Taxon.getVernacularNameByLang(lang)(taxon)
            return <div key={TaxonVernacularName.getUuid(vernacularName)}>
              {TaxonVernacularName.getName(vernacularName)}
            </div>
          }
        )
      }
    </>
  )
}

export default TaxaTableRow