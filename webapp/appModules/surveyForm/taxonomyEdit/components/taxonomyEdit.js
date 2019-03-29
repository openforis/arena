import './taxonomyEdit.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import UploadButton from '../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../commonComponents/form/downloadButton'
import ErrorBadge from '../../../../commonComponents/errorBadge'
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
  initTaxaList,
  loadTaxa,
} from '../actions'
import { getSurveyForm } from '../../surveyFormState'
import { canEditSurvey } from '../../../../../common/auth/authManager'

class TaxonomyEdit extends React.Component {

  async componentDidMount () {
    const {taxonomy, initTaxaList} = this.props

    if (Taxonomy.getUuid(taxonomy)) {
      initTaxaList(taxonomy)
    }
  }

  render () {
    const {
      surveyId, taxonomy, taxaCurrentPage, taxaTotalPages, taxaPerPage, taxa,
      loadTaxa, putTaxonomyProp, uploadTaxonomyFile, setTaxonomyForEdit,
      readOnly,
    } = this.props

    const {validation} = taxonomy

    return (
      <div className="taxonomy-edit">

        <div className="taxonomy-edit__header">

          <ErrorBadge validation={validation}/>

          <FormItem label="Taxonomy name">
            <div>
              <Input value={Taxonomy.getName(taxonomy)}
                     validation={getFieldValidation('name')(validation)}
                     onChange={value => putTaxonomyProp(taxonomy, 'name', normalizeName(value))}
                     readOnly={readOnly}/>
            </div>
          </FormItem>

          <div className="button-bar">
            {
              !readOnly &&
              <UploadButton label="CSV import"
                            disabled={Taxonomy.isPublished(taxonomy)}
                            onChange={(files) => uploadTaxonomyFile(taxonomy, files[0])}/>

            }
            <DownloadButton href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export?draft=true`}
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
                          onPageChange={(page) => loadTaxa(taxonomy, page)}/>
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
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, initTaxaList, loadTaxa,
  }
)(TaxonomyEdit)
