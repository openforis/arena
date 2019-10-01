import './taxonomyEditView.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import Authorizer from '../../../../common/auth/authorizer'

import TableView from '../../tableViews/tableView'
import TaxonomyEditHeader from './components/taxonomyEditHeader'
import TaxaTableRowHeader from './components/taxaTableRowHeader'
import TaxaTableRow from './components/taxaTableRow'
import { useI18n, useOnUpdate } from '../../../commonComponents/hooks'

import Taxonomy from '../../../../common/survey/taxonomy'
import Taxon from '../../../../common/survey/taxon'

import * as SurveyState from '../../../survey/surveyState'
import * as AppState from '../../../app/appState'
import * as TaxonomyEditState from './taxonomyEditState'
import * as TableViewState from '../../tableViews/tableViewsState'

import { putTaxonomyProp, setTaxonomyForEdit, uploadTaxonomyFile } from './actions'

const TaxonomyEditView = props => {

  const {
    surveyId, taxonomy, taxa,
    setTaxonomyForEdit,
    readOnly,
    putTaxonomyProp,
    uploadTaxonomyFile,
    activeJob,
  } = props

  const i18n = useI18n()

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  const vernacularLanguageCodes = R.reduce(
    (acc, taxon) => R.concat(acc, R.difference(R.keys(Taxon.getVernacularNames(taxon)), acc)),
    [],
    taxa
  )

  // useOnUpdate(() => {
  //   if (!activeJob) {
  //     initList(TaxonomyEditState.keys.taxa, moduleApiUri, moduleApiCountUri)
  //   }
  // }, [activeJob])

  const gridTemplateColumns = `.1fr .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`
  const moduleApiUri = `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa?draft=true&validate=true`
  const moduleApiCountUri = `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa/count`

  return (
    <div className="taxonomy-edit">

      <TaxonomyEditHeader {...props}/>

      <TableView
        module={TaxonomyEditState.keys.taxa}
        moduleApiUri={moduleApiUri}
        moduleApiCountUri={moduleApiCountUri}
        gridTemplateColumns={gridTemplateColumns}
        rowHeaderComponent={TaxaTableRowHeader}
        rowComponent={TaxaTableRow}
        noItemsLabelKey={'taxonomy.edit.taxaNotImported'}

        surveyId={surveyId}
        putTaxonomyProp={putTaxonomyProp}
        uploadTaxonomyFile={uploadTaxonomyFile}
        vernacularLanguageCodes={vernacularLanguageCodes}
        taxonomy={taxonomy}
        readOnly={readOnly}
      />

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
    taxa: TableViewState.getList('taxa')(state),
    activeJob,
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  {
    setTaxonomyForEdit, putTaxonomyProp, uploadTaxonomyFile,
  }
)(TaxonomyEditView)
