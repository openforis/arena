import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'

import * as Taxonomy from '@core/survey/taxonomy'

import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import { Button } from '@webapp/components/buttons'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useIsTaxonomiesRoute } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { TaxonomyCloneFromSurveyDialog } from '../TaxonomyCloneFromSurveyDialog'

const HeaderLeft = (props) => {
  const { headerProps = {} } = props
  const { onTaxonomyCreated } = headerProps

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const inTaxonomiesPath = useIsTaxonomiesRoute()

  const canEditSurvey = useAuthCanEditSurvey()

  const [cloneFromSurveyDialogOpen, setCloneFromSurveyDialogOpen] = useState(false)

  const onAdd = (taxonomyCreated) => {
    if (inTaxonomiesPath) {
      navigate(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomyCreated)}`)
    } else {
      onTaxonomyCreated(taxonomyCreated)
    }
  }

  const openCloneFromSurveyDialog = () => setCloneFromSurveyDialogOpen(true)
  const closeCloneFromSurveyDialog = () => setCloneFromSurveyDialogOpen(false)

  const onCloneFromSurveyConfirm = async ({ sourceSurveyId, sourceTaxonomyUuid }) => {
    const taxonomy = await API.cloneTaxonomyFromSurvey({ surveyId, sourceSurveyId, sourceTaxonomyUuid })
    dispatch(SurveyActions.surveyTaxonomyInserted(taxonomy))
    dispatch(SurveyActions.metaUpdated())
    closeCloneFromSurveyDialog()
    onAdd(taxonomy)
  }

  if (!canEditSurvey) {
    // placeholder to avoid breaking the header layout
    return <div></div>
  }

  return (
    <>
      <ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.taxonomy} />

      <Button
        iconClassName="icon-copy"
        label="taxonomy.cloneFromAnotherSurvey.title"
        onClick={openCloneFromSurveyDialog}
        size="small"
        variant="text"
      />

      {cloneFromSurveyDialogOpen && (
        <TaxonomyCloneFromSurveyDialog onClose={closeCloneFromSurveyDialog} onConfirm={onCloneFromSurveyConfirm} />
      )}
    </>
  )
}

HeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

export default HeaderLeft
