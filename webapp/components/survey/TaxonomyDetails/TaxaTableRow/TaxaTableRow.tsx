import type { ArenaTaxon } from '@openforis/arena-core'

import * as A from '@core/arena'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

type TaxaTableRowProps = {
  extraPropsDefsArray: any[]
  idx: number
  item: ArenaTaxon
  offset: number
  vernacularLanguageCodes: any[]
}

const TaxaTableRow = (props: TaxaTableRowProps) => {
  const { extraPropsDefsArray, idx, offset, item: taxon, vernacularLanguageCodes } = props

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
            {A.pipe(A.map(TaxonVernacularName.getName), A.join(TaxonVernacularName.NAMES_SEPARATOR))(vernacularNames)}
          </div>
        )
      })}
      {extraPropKeys.map((extraPropKey) => (
        <div key={`extra_prop_${extraPropKey}`}>{Taxon.getExtraProp(extraPropKey)(taxon)}</div>
      ))}
    </>
  )
}

export default TaxaTableRow
