import './taxonomyView.scss'

import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router'
import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import Table from '@webapp/components/Table/Table'
import TaxonomyEditHeader from './components/taxonomyEditHeader'
import TaxaTableRowHeader from './components/taxaTableRowHeader'
import TaxaTableRow from './components/taxaTableRow'

import * as TaxonomyActions from './actions'
import * as TaxonomyState from './taxonomyState'

const TaxonomyView = (props) => {
  const { showClose } = props

  const dispatch = useDispatch()
  const history = useHistory()
  const { taxonomyUuid: taxonomyUuidParam } = useParams()
  const i18n = useI18n()

  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()
  const taxonomy = useSelector(TaxonomyState.getTaxonomy)
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)

  const gridTemplateColumns = `.1fr .1fr .2fr .2fr .4fr ${
    R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`
  }`

  useEffect(() => {
    if (taxonomyUuidParam) {
      dispatch(TaxonomyActions.setTaxonomyForEdit(taxonomyUuidParam))
    }

    return () => dispatch(TaxonomyActions.setTaxonomyForEdit(null))
  }, [])

  return taxonomy ? (
    <div className="taxonomy">
      <TaxonomyEditHeader />

      <Table
        module={TaxonomyState.keys.taxa}
        moduleApiUri={`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`}
        restParams={{ draft: canEdit }}
        gridTemplateColumns={gridTemplateColumns}
        rowHeaderComponent={TaxaTableRowHeader}
        rowComponent={TaxaTableRow}
        noItemsLabelKey="taxonomy.edit.taxaNotImported"
        rowProps={{ surveyId, vernacularLanguageCodes, taxonomy, readOnly: !canEdit }}
      />

      {showClose && (
        <div className="button-bar">
          <button type="button" className="btn" onClick={() => history.goBack()}>
            {i18n.t('common.done')}
          </button>
        </div>
      )}
    </div>
  ) : null
}

TaxonomyView.propTypes = {
  showClose: PropTypes.bool,
}

TaxonomyView.defaultProps = {
  showClose: true,
}

export default TaxonomyView
