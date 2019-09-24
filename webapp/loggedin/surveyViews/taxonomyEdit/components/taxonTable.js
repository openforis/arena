import React from 'react'
import * as R from 'ramda'

import { useI18n } from '../../../../commonComponents/hooks'

import Taxonomy from '../../../../../common/survey/taxonomy'
import Taxon from '../../../../../common/survey/taxon'
import { languages } from '../../../../../common/app/languages'

import TablePaginator from '../../../tableViews/components/tablePaginator'

const TaxonTable = props => {

  const { taxonomy, taxa, currentPage, taxaTotal, rowsPerPage, onPageChange } = props
  const vernacularLanguageCodes = R.reduce(
    (acc, taxon) => R.concat(acc, R.difference(R.keys(Taxon.getVernacularNames(taxon)), acc)),
    [],
    taxa
  )

  const headerAndRowCustomStyle = {
    gridTemplateColumns: `60px .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`,
  }

  const i18n = useI18n()

  return (
    <div className="table taxa-table">

      <div className="table__header">
        <div/>

        <TablePaginator
          offset={currentPage * rowsPerPage}
          limit={rowsPerPage}
          count={taxaTotal}
          fetchFn={onPageChange}
        />
      </div>

      <div className="table__content">
        <div className="table__row-header"
             style={headerAndRowCustomStyle}>
          <div className="position">#</div>
          <div>{i18n.t('common.code')}</div>
          <div>{i18n.t('taxonomy.edit.family')}</div>
          <div>{i18n.t('taxonomy.edit.genus')}</div>
          <div>{i18n.t('taxonomy.edit.scientificName')}</div>
          {
            vernacularLanguageCodes.map(lang =>
              <div
                key={`vernacular_name_header_${Taxonomy.getUuid(taxonomy)}_${lang}`}>{R.propOr(lang, lang)(languages)}</div>)
          }
        </div>

        <div className="table__rows">
          {
            taxa.map(taxon =>
              <div key={Taxon.getUuid(taxon)}
                   className="table__row"
                   style={headerAndRowCustomStyle}>
                <div className="position">{currentPage * rowsPerPage + taxa.indexOf(taxon) + 1}</div>
                <div>{Taxon.getCode(taxon)}</div>
                <div>{Taxon.getFamily(taxon)}</div>
                <div>{Taxon.getGenus(taxon)}</div>
                <div>{Taxon.getScientificName(taxon)}</div>
                {
                  vernacularLanguageCodes.map(lang =>
                    <div key={`vernacular_name_${Taxon.getUuid(taxon)}_${lang}`}>
                      {Taxon.getVernacularName(lang)(taxon)}
                    </div>
                  )
                }
              </div>
            )
          }
        </div>
      </div>

    </div>
  )
}

export default TaxonTable
