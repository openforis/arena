import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import UploadButton from '../../../commonComponents/form/uploadButton'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../commonComponents/modal'
import TaxonTable from './taxonTable'

import { toQueryString } from '../../../../server/serverUtils/request'
import { isBlank } from '../../../../common/stringUtils'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import {
  getTaxonomyName,
} from '../../../../common/survey/taxonomy'
import { getFieldValidation } from '../../../../common/validation/validator'
import {
  getJobName,
  getJobErrors,
  isJobCompleted,
  isJobFailed,
} from '../../../../common/job/job'

import { getSurvey } from '../../surveyState'
import {
  getTaxonomyEditTaxonomy,
  getTaxonomyEditTaxaTotalPages,
  getTaxonomyEditTaxaCurrentPage,
  getTaxonomyEditTaxa, getTaxonomyEditImportErrors, isTaxonomyEditImportErrorsShown
} from '../taxonomyEditState'
import { getActiveJob } from '../../../app/components/job/appJobState'

import {
  setTaxonomyForEdit,
  putTaxonomyProp,
  uploadTaxonomyFile,
  reloadTaxa,
  loadTaxaPage,
  showTaxonomyImportErrors,
  hideTaxonomyImportErrors,
} from '../actions'

const ROWS_PER_PAGE = 15
const importTaxaJobName = 'import taxa'

const ImportErrrosModal = props => {
  const {errors, hideTaxonomyImportErrors} = props

  const getErrorMessage = error => {
    return R.pipe(
      fields => R.reduce((acc, field) => {
        const fieldValidation = R.prop(field, fields)
        return fieldValidation.valid
          ? acc
          : R.append(`${field}: ${R.path([field, 'errors'])(fields)}`, acc)
      }, [], R.keys(fields)),
      R.join('\n ')
    )(error)
  }

  return <Modal isOpen="true">

    <ModalHeader>
      Errors importing taxa
    </ModalHeader>

    <ModalBody>
      <div className="taxonomies__edit-errors-table">
        <div className="header">
          <div>Row</div>
          <div>Errors</div>
        </div>
        <div className="body">
          {
            R.keys(errors).map(rowIndex => {
              return (
                <div className="row">
                  <div>{Number(rowIndex) + 1}</div>
                  <div>{getErrorMessage(errors[rowIndex])}</div>
                </div>
              )
            })
          }
        </div>
      </div>
    </ModalBody>

    <ModalFooter>
      <button className="btn btn-of modal-footer__item"
              onClick={() => hideTaxonomyImportErrors()}>
        Close
      </button>
    </ModalFooter>
  </Modal>

}

class TaxonomyEdit extends React.Component {

  async componentDidMount () {
    const {taxonomy, reloadTaxa} = this.props

    if (taxonomy.id) {
      reloadTaxa()
    }
  }

  componentDidUpdate (prevProps) {
    const {activeJob, reloadTaxa, showTaxonomyImportErrors} = this.props
    const prevJob = prevProps.activeJob

    if (activeJob === null && prevJob && getJobName(prevJob) === importTaxaJobName) {
      if (isJobCompleted(prevJob)) {
        reloadTaxa()
      } else if (isJobFailed(prevJob)) {
        showTaxonomyImportErrors(getJobErrors(prevJob))
      }
    }
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
      importErrorsShown, importErrors,
      putTaxonomyProp, uploadTaxonomyFile,
    } = this.props

    const {validation} = taxonomy

    return importErrorsShown
      ? <ImportErrrosModal {...this.props}
                           errors={importErrors}/>
      : (
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

              <button className="btn btn-of btn-download"
                      aria-disabled={R.isEmpty(taxa)}
                      onClick={() => this.exportTaxonomy()}>
                <span className="icon icon-cloud-download icon-16px icon-left"/>
                Csv Export
              </button>
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
                            onPageChange={(page) => this.onPageChange(page)}/>
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
    survey,
    taxonomy: getTaxonomyEditTaxonomy(survey),
    taxaTotalPages: getTaxonomyEditTaxaTotalPages(survey),
    taxaCurrentPage: getTaxonomyEditTaxaCurrentPage(survey),
    taxa: getTaxonomyEditTaxa(survey),
    importErrorsShown: isTaxonomyEditImportErrorsShown(survey),
    importErrors: getTaxonomyEditImportErrors(survey),
    activeJob: getActiveJob(state)
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, reloadTaxa, loadTaxaPage,
    showTaxonomyImportErrors, hideTaxonomyImportErrors
  }
)(TaxonomyEdit)
