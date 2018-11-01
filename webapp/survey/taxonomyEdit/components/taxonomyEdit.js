import './taxonomyEdit.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import UploadButton from '../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../commonComponents/form/downloadButton'
import TaxonTable from './taxonTable'

import { isBlank } from '../../../../common/stringUtils'
import { normalizeName } from '../../../../common/survey/surveyUtils'

import { getSurveyId, } from '../../../../common/survey/survey'
import { getTaxonomyName, } from '../../../../common/survey/taxonomy'
import {
  getTaxonomyEditTaxonomy,
  getTaxonomyEditTaxaTotalPages,
  getTaxonomyEditTaxaCurrentPage,
  getTaxonomyEditTaxa,
  getTaxonomyEditTaxaPerPage
} from '../taxonomyEditState'

import { getSurvey } from '../../surveyState'
import { getActiveJob } from '../../../app/components/job/appJobState'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  setTaxonomyForEdit,
  putTaxonomyProp,
  uploadTaxonomyFile,
  reloadTaxa,
  loadTaxa,
} from '../actions'

class TaxonomyEdit extends React.Component {

  async componentDidMount () {
    const {taxonomy, reloadTaxa} = this.props

    if (taxonomy.id) {
      reloadTaxa(taxonomy)
    }
  }

  onDone () {
    const {taxonomy, setTaxonomyForEdit} = this.props

    if (isBlank(getTaxonomyName(taxonomy))) {
      alert('Please specify a name')
    } else {
      setTaxonomyForEdit(null)
    }
  }

  render () {
    const {
      surveyId, taxonomy, taxaCurrentPage, taxaTotalPages, taxaPerPage, taxa,
      loadTaxaPage, putTaxonomyProp, uploadTaxonomyFile,
    } = this.props

    const {validation} = taxonomy

    return (
      <div className="taxonomy-edit">

        <div className="taxonomy-edit__header">
          <FormItem label="Taxonomy name">
            <Input value={getTaxonomyName(taxonomy)}
                   validation={getFieldValidation('name')(validation)}
                   onChange={e => putTaxonomyProp(taxonomy, 'name', normalizeName(e.target.value))}/>
          </FormItem>

          <div className="button-bar">
            <UploadButton label="CSV import"
                          onChange={(files) => uploadTaxonomyFile(taxonomy, files[0])}/>

            <DownloadButton href={`/api/survey/${surveyId}/taxonomies/${taxonomy.id}/export?draft=true`}
                            disabled={R.isEmpty(taxa)}
                            label="CSV Export"/>
          </div>
        </div>


        {
          R.isEmpty(taxa)
            ? <div className="taxonomy-edit__empty-taxa">Taxa not imported</div>
            : <TaxonTable taxonomy={taxonomy}
                          taxa={taxa}
                          currentPage={taxaCurrentPage}
                          totalPages={taxaTotalPages}
                          rowsPerPage={taxaPerPage}
                          onPageChange={(page) => loadTaxaPage(taxonomy, page)}/>
        }

        <div style={{justifySelf: 'center'}}>
          <button className="btn btn-of-light"
                  onClick={() => this.onDone()}>
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
    surveyId: getSurveyId(survey),
    taxonomy: getTaxonomyEditTaxonomy(survey),
    taxaCurrentPage: getTaxonomyEditTaxaCurrentPage(survey),
    taxaTotalPages: getTaxonomyEditTaxaTotalPages(survey),
    taxaPerPage: getTaxonomyEditTaxaPerPage(survey),
    taxa: getTaxonomyEditTaxa(survey),
    activeJob: getActiveJob(state)
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, reloadTaxa, loadTaxaPage: loadTaxa,
  }
)(TaxonomyEdit)
