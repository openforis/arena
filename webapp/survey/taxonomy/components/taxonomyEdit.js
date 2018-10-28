import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import UploadButton from '../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../commonComponents/form/downloadButton'
import TaxonTable from './taxonTable'

import { isBlank } from '../../../../common/stringUtils'
import { normalizeName } from '../../../../common/survey/surveyUtils'

import { getTaxonomyName, } from '../../../../common/survey/taxonomy'
import {
  getTaxonomyEditTaxonomy,
  getTaxonomyEditTaxaTotalPages,
  getTaxonomyEditTaxaCurrentPage,
  getTaxonomyEditTaxa
} from '../taxonomyEditState'

import { getSurveyState } from '../../surveyState'
import { getActiveJob } from '../../../app/components/job/appJobState'
import { getJobName, isJobCompleted, } from '../../../../common/job/job'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  setTaxonomyForEdit,
  putTaxonomyProp,
  uploadTaxonomyFile,
  reloadTaxa,
  loadTaxaPage,
} from '../actions'

const ROWS_PER_PAGE = 15
const importTaxaJobName = 'import taxa'

class TaxonomyEdit extends React.Component {

  async componentDidMount () {
    const {taxonomy, reloadTaxa} = this.props

    if (taxonomy.id) {
      reloadTaxa()
    }
  }

  componentDidUpdate (prevProps) {
    const {activeJob, reloadTaxa} = this.props
    const prevJob = prevProps.activeJob

    if (activeJob === null && prevJob
      && getJobName(prevJob) === importTaxaJobName
      && isJobCompleted(prevJob)) {
      reloadTaxa()
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
      survey, taxonomy, taxaCurrentPage, taxaTotalPages, taxa,
      loadTaxaPage, putTaxonomyProp, uploadTaxonomyFile,
    } = this.props

    const {validation} = taxonomy

    return (
      <div className="taxonomy-edit">

        <div className="taxonomy-edit__header">
          <FormItem label="Taxonomy name">
            <Input value={getTaxonomyName(taxonomy)}
                   validation={getFieldValidation('name')(validation)}
                   onChange={e => putTaxonomyProp(taxonomy.uuid, 'name', normalizeName(e.target.value))}/>
          </FormItem>

          <div className="button-bar">
            <UploadButton label="CSV import"
                          onChange={(files) => uploadTaxonomyFile(survey.id, taxonomy.id, files[0])}/>

            <DownloadButton href={`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/export?draft=true`}
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
                          rowsPerPage={ROWS_PER_PAGE}
                          onPageChange={(page) => loadTaxaPage(page)}/>
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
  const survey = getSurveyState(state)

  return {
    survey,
    taxonomy: getTaxonomyEditTaxonomy(survey),
    taxaTotalPages: getTaxonomyEditTaxaTotalPages(survey),
    taxaCurrentPage: getTaxonomyEditTaxaCurrentPage(survey),
    taxa: getTaxonomyEditTaxa(survey),
    activeJob: getActiveJob(state)
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, reloadTaxa, loadTaxaPage,
  }
)(TaxonomyEdit)
