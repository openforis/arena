import './taxonomyEdit.scss'

import React, { useEffect } from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import UploadButton from '../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../commonComponents/form/downloadButton'
import ErrorBadge from '../../../../commonComponents/errorBadge'
import useI18n from '../../../../commonComponents/useI18n'
import TaxonTable from './taxonTable'

import Taxonomy from '../../../../../common/survey/taxonomy'
import { normalizeName } from '../../../../../common/stringUtils'
import { getFieldValidation } from '../../../../../common/validation/validator'

import * as SurveyState from '../../../../survey/surveyState'
import * as AppState from '../../../../app/appState'
import * as TaxonomyEditState from '../taxonomyEditState'

import { initTaxaList, loadTaxa, putTaxonomyProp, setTaxonomyForEdit, uploadTaxonomyFile } from '../actions'
import Authorizer from '../../../../../common/auth/authorizer'

const TaxonomyEdit = props => {

  const {
    surveyId, taxonomy, taxaCurrentPage, taxaTotalPages, taxaTotal, taxaPerPage, taxa,
    loadTaxa, putTaxonomyProp, uploadTaxonomyFile, setTaxonomyForEdit,
    readOnly,
  } = props

  useEffect(() => {
    const { initTaxaList } = props
    if (Taxonomy.getUuid(taxonomy)) {
      initTaxaList(taxonomy)
    }
  }, [Taxonomy.getUuid(taxonomy)])

  const { validation } = taxonomy

  const i18n = useI18n()

  return (
    <div className="taxonomy-edit">

      <div className="taxonomy-edit__header">

        <ErrorBadge validation={validation}/>

        <FormItem label={i18n.t('taxonomy.edit.taxonomyName')}>
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
            <UploadButton label={i18n.t('common.csvImport')}
                          disabled={Taxonomy.isPublished(taxonomy)}
                          onChange={(files) => uploadTaxonomyFile(taxonomy, files[0])}/>

          }
          <DownloadButton href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export?draft=true`}
                          disabled={R.isEmpty(taxa)}
                          label={i18n.t('common.csvExport')}/>
        </div>
      </div>


      {
        R.isEmpty(taxa)
          ? <div className="taxonomy-edit__empty-taxa">{i18n.t('taxonomy.edit.taxaNotImported')}</div>
          : <TaxonTable taxonomy={taxonomy}
                        taxa={taxa}
                        currentPage={taxaCurrentPage}
                        totalPages={taxaTotalPages}
                        taxaTotal={taxaTotal}
                        rowsPerPage={taxaPerPage}
                        onPageChange={(offset) => loadTaxa(taxonomy, offset)}/>
      }

      <div style={{ justifySelf: 'center' }}>
        <button className="btn"
                onClick={() => setTaxonomyForEdit(null)}>
          {i18n.t('common.done')}
        </button>
      </div>

    </div>
  )
}

const mapStateToProps = state => {
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const activeJob = AppState.getActiveJob(state)

  return {
    surveyId: SurveyState.getSurveyId(state),
    taxonomy: TaxonomyEditState.getTaxonomy(state),
    taxaCurrentPage: TaxonomyEditState.getTaxaCurrentPage(state),
    taxaTotalPages: TaxonomyEditState.getTaxaTotalPages(state),
    taxaTotal: TaxonomyEditState.getTaxaTotal(state),
    taxaPerPage: TaxonomyEditState.getTaxaPerPage(state),
    taxa: TaxonomyEditState.getTaxa(state),
    activeJob,
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile, initTaxaList, loadTaxa,
  }
)(TaxonomyEdit)
