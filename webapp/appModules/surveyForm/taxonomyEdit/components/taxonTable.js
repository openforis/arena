import React from 'react'
import * as R from 'ramda'

import Taxonomy from '../../../../../common/survey/taxonomy'
import Taxon from '../../../../../common/survey/taxon'
import { languages } from '../../../../../common/app/languages'

class TaxonTable extends React.Component {

  constructor (props) {
    super(props)

    this.tableBody = React.createRef()
  }

  componentDidUpdate () {
    this.tableBody.current.scrollTop = 0
  }

  render () {
    const {taxonomy, taxa, currentPage, totalPages, rowsPerPage, onPageChange} = this.props
    const vernacularLanguageCodes = R.reduce(
      (acc, taxon) => R.concat(acc, R.difference(R.keys(Taxon.getVernacularNames(taxon)), acc)),
      [],
      taxa)

    const headerAndRowCustomStyle = {
      gridTemplateColumns: `60px .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`
    }

    return <div className="taxa-table">
      <div className="header"
           style={headerAndRowCustomStyle}>
        <div className="position">#</div>
        <div>CODE</div>
        <div>FAMILY</div>
        <div>GENUS</div>
        <div>SCIENTIFIC NAME</div>
        {
          vernacularLanguageCodes.map(lang =>
            <div key={`vernacular_name_header_${Taxonomy.getUuid(taxonomy)}_${lang}`}>{R.propOr(lang, lang)(languages)}</div>)
        }
      </div>
      <div className="body"
           ref={this.tableBody}>
        {
          taxa.map(taxon =>
            <div key={Taxon.getUuid(taxon)}
                 className="row"
                 style={headerAndRowCustomStyle}>
              <div className="position">{(currentPage - 1) * rowsPerPage + taxa.indexOf(taxon) + 1}</div>
              <div>{Taxon.getCode(taxon)}</div>
              <div>{Taxon.getFamily(taxon)}</div>
              <div>{Taxon.getGenus(taxon)}</div>
              <div>{Taxon.getScientificName(taxon)}</div>
              {
                vernacularLanguageCodes.map(lang =>
                  <div key={`vernacular_name_${Taxon.getUuid(taxon)}_${lang}`}>{Taxon.getVernacularName(lang)(taxon)}</div>)
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
                onClick={() => onPageChange(currentPage - 1)}
                style={{transform: 'scaleX(-1)'}}>
          <span className="icon icon-play3 icon-16px"/>
        </button>
        <span className="page-count">{currentPage} / {totalPages}</span>
        <button className="btn btn-of-light"
                aria-disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}>
          <span className="icon icon-play3 icon-16px"/>
        </button>
        <button className="btn btn-of-light"
                aria-disabled={currentPage === totalPages}
                onClick={() => onPageChange(totalPages)}>
          <span className="icon icon-forward3 icon-16px"/>
        </button>
      </div>
    </div>
  }
}

export default TaxonTable