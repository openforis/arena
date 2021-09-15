import './TaxonomyDetails.scss'

import * as A from '@core/arena'

import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'

import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { DataTestId } from '@webapp/utils/dataTestId'

import { ButtonBack } from '@webapp/components/buttons'
import Table from '@webapp/components/Table/Table'
import Header from './Header'
import TaxaTableRowHeader from './TaxaTableRowHeader'
import TaxaTableRow from './TaxaTableRow'

import { State, useLocalState } from './store'

const TaxonomyDetails = (props) => {
  const { showClose } = props

  const { state, Actions } = useLocalState(props)

  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  const taxonomy = State.getTaxonomy(state)

  if (A.isEmpty(taxonomy)) return null

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropsDefs = Taxonomy.getExtraPropsDefs(taxonomy)

  const gridTemplateColumns = `.1fr .1fr .2fr .2fr .4fr ${
    R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 80px)`
  }
  ${R.isEmpty(extraPropsDefs) ? '' : `repeat(${Object.keys(extraPropsDefs).length}, 80px)`}`

  return (
    <div className="taxonomy">
      <Header state={state} Actions={Actions} />

      <div className="taxonomy__table-container">
        {!A.isEmpty(taxonomyUuid) && (
          <Table
            module="taxa"
            moduleApiUri={`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`}
            restParams={{ draft: canEdit, taxaVersion: State.getTaxaVersion(state) }}
            gridTemplateColumns={gridTemplateColumns}
            rowHeaderComponent={TaxaTableRowHeader}
            rowComponent={TaxaTableRow}
            noItemsLabelKey="taxonomy.edit.taxaNotImported"
            rowProps={{ surveyId, taxonomyUuid, vernacularLanguageCodes, extraPropsDefs, readOnly: !canEdit }}
          />
        )}
      </div>

      {showClose && (
        <div className="button-bar">
          <ButtonBack testId={DataTestId.taxonomyDetails.doneEditBtn} />
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
