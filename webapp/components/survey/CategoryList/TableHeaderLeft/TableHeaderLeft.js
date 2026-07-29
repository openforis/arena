import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { useIsCategoriesRoute } from '@webapp/components/hooks'
import { Button } from '@webapp/components/buttons'
import { ButtonMenuExport } from '@webapp/components/buttons/ButtonMenuExport'
import { UploadButton } from '@webapp/components/form'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { CategoryCloneFromSurveyDialog } from '../CategoryCloneFromSurveyDialog'
import { useActions, State } from '../store'

const TableHeaderLeft = (props) => {
  const { headerProps = {} } = props
  const { state, setState } = headerProps
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const Actions = useActions({ setState })

  const inCategoriesPath = useIsCategoriesRoute()
  const canEditSurvey = useAuthCanEditSurvey()

  const [cloneFromSurveyDialogOpen, setCloneFromSurveyDialogOpen] = useState(false)

  const onAdd = (categoryCreated) => {
    if (inCategoriesPath) {
      navigate(`${appModuleUri(designerModules.category)}${Category.getUuid(categoryCreated)}`)
    } else {
      const onCreate = State.getOnCategoryCreated(state)
      if (onCreate) {
        onCreate(categoryCreated)
      }
    }
  }

  const openCloneFromSurveyDialog = () => setCloneFromSurveyDialogOpen(true)
  const closeCloneFromSurveyDialog = () => setCloneFromSurveyDialogOpen(false)

  const onCloneFromSurveyConfirm = async ({ sourceSurveyId, sourceCategoryUuid }) => {
    const category = await API.cloneCategoryFromSurvey({ surveyId, sourceSurveyId, sourceCategoryUuid })
    dispatch(SurveyActions.surveyCategoryInserted(category))
    dispatch(SurveyActions.metaUpdated())
    closeCloneFromSurveyDialog()
    onAdd(category)
  }

  if (!canEditSurvey) {
    // placeholder to avoid breaking the header layout
    return <div></div>
  }

  return (
    <>
      <ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.category} />

      <Button
        iconClassName="icon-copy"
        label="categoryList.cloneFromAnotherSurvey.title"
        onClick={openCloneFromSurveyDialog}
        size="small"
        variant="text"
      />

      <ButtonMenuExport label="common.exportAll" onClick={Actions.exportAll} />

      <UploadButton
        inputFieldId="taxonomy-upload-input"
        label="categoryList.batchImport"
        accept=".zip"
        onChange={([file]) => Actions.startBatchImport({ file })}
      />

      {cloneFromSurveyDialogOpen && (
        <CategoryCloneFromSurveyDialog onClose={closeCloneFromSurveyDialog} onConfirm={onCloneFromSurveyConfirm} />
      )}
    </>
  )
}

TableHeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

export default TableHeaderLeft
