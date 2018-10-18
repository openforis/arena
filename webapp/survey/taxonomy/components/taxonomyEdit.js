import React from 'react'
import * as R from 'ramda'

import TaxonTable from './taxonTable'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { toQueryString } from '../../../../server/serverUtils/request'
import { isBlank } from '../../../../common/stringUtils'
import {
  getTaxonomyName,
} from '../../../../common/survey/taxonomy'
import { getFieldValidation } from '../../../../common/validation/validator'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import UploadButton from '../../../commonComponents/form/uploadButton'
import { getSurvey } from '../../surveyState'
import {
  getTaxonomyEditImportingFile,
  getTaxonomyEditTaxonomy,
  getTaxonomyEditTaxaTotalPages,
  getTaxonomyEditTaxaCurrentPage, getTaxonomyEditTaxa
} from '../taxonomyEditState'
import connect from 'react-redux/es/connect/connect'
import { setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, reloadTaxa, loadTaxaPage } from '../actions'

const ROWS_PER_PAGE = 15

class TaxonomyEdit extends React.Component {

  async componentDidMount () {
    this.props.reloadTaxa()
  }

  componentDidUpdate () {

  }

  exportTaxonomy () {
    const {
      survey, taxonomy,
    } = this.props

    const params = {
      draft: true
    }
    window.open(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/export?${toQueryString(params)}`, '_blank')
  }

  onPageChange (page) {
    this.props.loadTaxaPage(page)
  }

  render () {
    const {
      survey, taxonomy, taxaCurrentPage, taxaTotalPages, taxa,
      putTaxonomyProp, setTaxonomyForEdit, uploadTaxonomyFile,
    } = this.props

    const {validation} = taxonomy

    const taxonomyName = getTaxonomyName(taxonomy)
    return (
      <div className="taxonomies__edit">

        <FormItem label="Taxonomy name">
          <Input value={taxonomyName}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => putTaxonomyProp(taxonomy.uuid, 'name', normalizeName(e.target.value))}/>
        </FormItem>

        <div className="action-bar">
          <UploadButton label="IMPORT"
                        onChange={(files) => uploadTaxonomyFile(survey.id, taxonomy.id, files[0])}/>

          <button className="btn btn-of btn-download"
                  disabled={R.isEmpty(taxa)}
                  onClick={() => this.exportTaxonomy()}>
            <span className="icon icon-cloud-download icon-16px icon-left"/>
            EXPORT
          </button>
        </div>

        {
          R.isEmpty(taxa)
            ? <div>Taxonomy not imported</div>
            : <TaxonTable taxonomy={taxonomy}
                          taxa={taxa}
                          currentPage={taxaCurrentPage}
                          totalPages={taxaTotalPages}
                          rowsPerPage={ROWS_PER_PAGE}
                          onPageChange={(page) => this.onPageChange(page)}/>
        }

        <div style={{justifySelf: 'center'}}>
          <button className="btn btn-of-light"
                  aria-disabled={isBlank(taxonomyName)}
                  onClick={() => setTaxonomyForEdit(null)}>
            Done
          </button>
        </div>

      </div>
    )
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    taxonomy: getTaxonomyEditTaxonomy(survey),
    taxaTotalPages: getTaxonomyEditTaxaTotalPages(survey),
    taxaCurrentPage: getTaxonomyEditTaxaCurrentPage(survey),
    taxa: getTaxonomyEditTaxa(survey),
    importingTaxonomy: getTaxonomyEditImportingFile(survey),
  }
}

export default connect(
  mapStateToProps,
  {setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, reloadTaxa, loadTaxaPage}
)(TaxonomyEdit)
