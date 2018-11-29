import './taxonomyEdit.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import UploadButton from '../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../commonComponents/form/downloadButton'
import TaxonTable from './taxonTable'

import Taxonomy from '../../../../../common/survey/taxonomy'
import { normalizeName } from '../../../../../common/stringUtils'
import { getFieldValidation } from '../../../../../common/validation/validator'

import {
  getTaxonomyEditTaxonomy,
  getTaxonomyEditTaxaTotalPages,
  getTaxonomyEditTaxaCurrentPage,
  getTaxonomyEditTaxa,
  getTaxonomyEditTaxaPerPage
} from '../taxonomyEditState'

import { getActiveJob } from '../../../appView/components/job/appJobState'
import { getStateSurveyInfo, getSurvey, getStateSurveyId } from '../../../../survey/surveyState'
import { getUser } from '../../../../app/appState'

import {
  setTaxonomyForEdit,
  putTaxonomyProp,
  uploadTaxonomyFile,
  reloadTaxa,
  loadTaxa,
} from '../actions'
import { getSurveyForm } from '../../surveyFormState'
import { canEditSurvey } from '../../../../../common/auth/authManager'

class TaxonomyEdit extends React.Component {

  async componentDidMount () {
    const {taxonomy, reloadTaxa} = this.props

    if (taxonomy.id) {
      reloadTaxa(taxonomy)
    }
  }

  render () {
    const {
      surveyId, taxonomy, taxaCurrentPage, taxaTotalPages, taxaPerPage, taxa,
      loadTaxaPage, putTaxonomyProp, uploadTaxonomyFile, setTaxonomyForEdit,
      readOnly,
    } = this.props

    const {validation} = taxonomy

    return (
      <div className="taxonomy-edit">

        <div className="taxonomy-edit__header">
          <FormItem label="Taxonomy name">
            <Input value={Taxonomy.getTaxonomyName(taxonomy)}
                   validation={getFieldValidation('name')(validation)}
                   onChange={value => putTaxonomyProp(taxonomy, 'name', normalizeName(value))}
                   readOnly={readOnly}/>
          </FormItem>

          {
            !readOnly &&
            <div className="button-bar">
              <UploadButton label="CSV import"
                            disabled={taxonomy.published}
                            title={taxonomy.published ? 'Import not allowed for published Taxonomy' : null}
                            onChange={(files) => uploadTaxonomyFile(taxonomy, files[0])}/>

              <DownloadButton href={`/api/survey/${surveyId}/taxonomies/${taxonomy.id}/export?draft=true`}
                              disabled={R.isEmpty(taxa)}
                              label="CSV Export"/>
            </div>
          }
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
  const surveyForm = getSurveyForm(state)
  const user = getUser(state)
  const surveyInfo = getStateSurveyInfo(state)

  return {
    surveyId: getStateSurveyId(state),
    taxonomy: getTaxonomyEditTaxonomy(survey)(surveyForm),
    taxaCurrentPage: getTaxonomyEditTaxaCurrentPage(surveyForm),
    taxaTotalPages: getTaxonomyEditTaxaTotalPages(surveyForm),
    taxaPerPage: getTaxonomyEditTaxaPerPage(surveyForm),
    taxa: getTaxonomyEditTaxa(surveyForm),
    activeJob: getActiveJob(state),
    readOnly: !canEditSurvey(user, surveyInfo)
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, reloadTaxa, loadTaxaPage: loadTaxa,
  }
)(TaxonomyEdit)
