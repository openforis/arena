import React from 'react'
import * as R from 'ramda'

import { useI18n } from '../../../../commonComponents/hooks'

import Taxonomy from '../../../../../common/survey/taxonomy'
import Taxon from '../../../../../common/survey/taxon'
import { languages } from '../../../../../common/app/languages'

import TableView from '../../../tableViews/tableView'

const TaxonRowHeader = ({ vernacularLanguageCodes, taxonomy }) => {
  const i18n = useI18n()

  return (
    <>
      <div className="position">#</div>
      <div>{i18n.t('common.code')}</div>
      <div>{i18n.t('taxonomy.edit.family')}</div>
      <div>{i18n.t('taxonomy.edit.genus')}</div>
      <div>{i18n.t('taxonomy.edit.scientificName')}</div>
      {
        vernacularLanguageCodes.map(lang =>
          <div key={`vernacular_name_header_${Taxonomy.getUuid(taxonomy)}_${lang}`}>
            {R.propOr(lang, lang)(languages)}\
          </div>
        )
      }
    </>
  )
}
const TaxonRow = ({ row, vernacularLanguageCodes }) => (
  <>
    {/* <div className="position">{currentPage * rowsPerPage + taxa.indexOf(row) + 1}</div> */}
    <div>#</div>
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

const TaxonTable = props => {

  const { surveyId, taxonomy, taxa } = props
  const vernacularLanguageCodes = R.reduce(
    (acc, taxon) => R.concat(acc, R.difference(R.keys(Taxon.getVernacularNames(taxon)), acc)),
    [],
    taxa
  )

  const gridTemplateColumns = `60px .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  return (
    <TableView
      module='taxa' // TODO
      moduleApiUri={`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`}

      className="taxonomy-edit"
      gridTemplateColumns={gridTemplateColumns}
      rowHeaderComponent={TaxonRowHeader}
      rowComponent={TaxonRow}
      noItemsLabelKey={'taxonomy.edit.taxaNotImported'}

      vernacularLanguageCodes={vernacularLanguageCodes}
      taxonomy={taxonomy}
    />
  )
}

export default TaxonTable
