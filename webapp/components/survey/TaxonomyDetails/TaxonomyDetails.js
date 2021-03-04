import './TaxonomyDetails.scss'

import * as A from '@core/arena'

import React from 'react'
import PropTypes from 'prop-types'

import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { DataTestId } from '@webapp/utils/dataTestId'

import Table from '@webapp/components/Table/Table'
import Header from './Header'
import TaxaTableRowHeader from './TaxaTableRowHeader'
import TaxaTableRow from './TaxaTableRow'

import { State, useLocalState } from './store'

const TaxonomyDetails = (props) => {
  const { showClose } = props

  const { state, Actions } = useLocalState(props)

  const history = useHistory()

  const i18n = useI18n()

  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  const taxonomy = State.getTaxonomy(state)

  if (A.isEmpty(taxonomy)) return null
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)

  const gridTemplateColumns = `.1fr .1fr .2fr .2fr .4fr ${
    R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`
  }`

  return (
    <div className="taxonomy">
      <Header state={state} Actions={Actions} />

      <div key={State.getTaxaVersion(state)} className="taxonomy__table-container">
        {!A.isEmpty(taxonomyUuid) && (
          <Table
            module="taxa"
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
        <div className="button-bar" data-testid={DataTestId.taxonomyDetails.doneEditBtn}>
          <button type="button" className="btn" onClick={history.goBack}>
            {i18n.t('common.done')}
          </button>
        </div>
      )}
    </div>
  )
}

TaxonomyDetails.propTypes = {
  showClose: PropTypes.bool,
}

TaxonomyDetails.defaultProps = {
  showClose: true,
}

export default TaxonomyDetails
