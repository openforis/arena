import './TaxonomyDetail.scss'

import * as A from '@core/arena'

import React from 'react'
import PropTypes from 'prop-types'

import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import Table from '@webapp/components/Table/Table'
import EditHeader from './EditHeader'
import TaxaTableRowHeader from './TaxaTableRowHeader'
import TaxaTableRow from './TaxaTableRow'

import * as TaxonomyState from './taxonomyState'

import { State, useTaxonomyDetail } from './store'

const TaxonomyDetail = (props) => {
  const { showClose } = props

  const { state, Actions } = useTaxonomyDetail(props)

  const history = useHistory()

  const i18n = useI18n()

  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  if (A.isEmpty(state)) return null
  const taxonomy = State.getTaxonomy(state)

  if (A.isEmpty(taxonomy)) return null
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)

  const gridTemplateColumns = `.1fr .1fr .2fr .2fr .4fr ${
    R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`
  }`

  return (
    <div className="taxonomy">
      <EditHeader state={state} Actions={Actions} />

      <div key={State.getTaxaVersion(state)} className="taxonomy__table-container">
        {!A.isEmpty(taxonomyUuid) && (
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
        )}
      </div>

      {showClose && (
        <div className="button-bar">
          <button
            type="button"
            className="btn"
            onClick={() => {
              history.goBack()
            }}
          >
            {i18n.t('common.done')}
          </button>
        </div>
      )}
    </div>
  )
}

TaxonomyDetail.propTypes = {
  showClose: PropTypes.bool,
}

TaxonomyDetail.defaultProps = {
  showClose: true,
}

export default TaxonomyDetail
