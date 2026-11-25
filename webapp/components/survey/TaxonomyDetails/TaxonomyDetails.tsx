import './TaxonomyDetails.scss'

import classNames from 'classnames'

import * as A from '@core/arena'
import * as Taxonomy from '@core/survey/taxonomy'
import { ButtonBack } from '@webapp/components/buttons'
import Table from '@webapp/components/Table/Table'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import Header from './Header'
import { State, useLocalState } from './store'
import TaxaTableRow from './TaxaTableRow'
import TaxaTableRowHeader from './TaxaTableRowHeader'

type TaxonomyDetailsProps = {
  showClose?: boolean
  // read by useLocalState: the taxonomy to edit (otherwise taken from the URL)
  taxonomyUuid?: string
}

const TaxonomyDetails = (props: TaxonomyDetailsProps) => {
  const { showClose = true } = props

  const { state, Actions } = useLocalState(props)

  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  const taxonomy = State.getTaxonomy(state)

  if (A.isEmpty(taxonomy)) return null

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropsDefsArray = Taxonomy.getExtraPropsDefsArray(taxonomy)

  const onlyRequiredColumns = A.isEmpty(vernacularLanguageCodes) && A.isEmpty(extraPropsDefsArray)

  const vernacularColumns = A.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 20rem)`
  const extraPropsColumns = A.isEmpty(extraPropsDefsArray) ? '' : `repeat(${extraPropsDefsArray.length}, 15rem)`
  const gridTemplateColumns = onlyRequiredColumns
    ? `.1fr .1fr .2fr .2fr .4fr`
    : `4rem 15rem 15rem 20rem 30rem ${vernacularColumns} ${extraPropsColumns}`

  return (
    <div className={classNames('taxonomy', { onlyRequiredColumns })}>
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
            rowProps={{ surveyId, taxonomyUuid, vernacularLanguageCodes, extraPropsDefsArray, readOnly: !canEdit }}
          />
        )}
      </div>

      {showClose && (
        <div className="button-bar">
          <ButtonBack testId={TestId.taxonomyDetails.doneEditBtn} />
        </div>
      )}
    </div>
  )
}

export default TaxonomyDetails
