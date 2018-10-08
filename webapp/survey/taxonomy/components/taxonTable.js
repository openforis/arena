import React from 'react'
import * as R from 'ramda'

import {
  getTaxonCode,
  getTaxonFamily,
  getTaxonGenus,
  getTaxonScientificName,
  getTaxonVernacularNames,
  getTaxonVernacularName,
} from '../../../../common/survey/taxonomy'
import { languages } from '../../../../common/app/languages'

const TaxonTable = props => {
  const {taxonomy, taxa, currentPage, totalPages, rowsPerPage, onPageChange} = props
  const vernacularLanguageCodes = R.reduce(
    (acc, taxon) => R.concat(acc, R.difference(R.keys(getTaxonVernacularNames(taxon)), acc)),
    [],
    taxa)

  return <div className="taxa-table">
    <div className="header"
         style={{gridTemplateColumns: `60px .1fr .2fr .2fr .4fr repeat(${vernacularLanguageCodes.length}, 60px)`}}>
      <div>#</div>
      <div>CODE</div>
      <div>FAMILY</div>
      <div>GENUS</div>
      <div>SCIENTIFIC NAME</div>
      {
        vernacularLanguageCodes.map(lang =>
          <div key={`vernacular_name_header_${taxonomy.uuid}_${lang}`}>{R.propOr(lang, lang)(languages)}</div>)
      }
    </div>
    <div className="body">
      {
        taxa.map(taxon =>
          <div key={taxon.uuid}
               className="row"
               style={{gridTemplateColumns: `60px .1fr .2fr .2fr .4fr repeat(${vernacularLanguageCodes.length}, 60px)`}}>
            <div style={{textAlign: right}}>{((currentPage - 1) * rowsPerPage) + taxa.indexOf(taxon) + 1}</div>
            <div>{getTaxonCode(taxon)}</div>
            <div>{getTaxonFamily(taxon)}</div>
            <div>{getTaxonGenus(taxon)}</div>
            <div>{getTaxonScientificName(taxon)}</div>
            {
              vernacularLanguageCodes.map(lang =>
                <div key={`vernacular_name_${taxon.uuid}_${lang}`}>{getTaxonVernacularName(lang)(taxon)}</div>)
            }
          </div>)
      }
    </div>

    <div className="paginator">
      <button className="btn btn-of-light"
              aria-disabled={currentPage === 1}
              onClick={() => onPageChange(1)}>
        <span className="icon icon-backward2 icon-16px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}>
        <span className="icon icon-arrow-left icon-16px"/>
      </button>
      <span>{currentPage} / {totalPages}</span>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}>
        <span className="icon icon-arrow-right icon-16px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}>
        <span className="icon icon-forward3 icon-16px"/>
      </button>
    </div>
  </div>
}

export default TaxonTable