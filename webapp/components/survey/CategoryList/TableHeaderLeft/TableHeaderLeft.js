import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { useIsCategoriesRoute } from '@webapp/components/hooks'
import { Button, ButtonMenu } from '@webapp/components/buttons'
import { ButtonMenuExport } from '@webapp/components/buttons/ButtonMenuExport'
import { UploadButton } from '@webapp/components/form'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId, useCategoryByName } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { CategoryCloneFromSurveyDialog } from '../CategoryCloneFromSurveyDialog'
import { LockFixedPropertiesDialog } from '../LockFixedPropertiesDialog'
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

  const samplingPointDataCategory = useCategoryByName(Survey.samplingPointDataCategoryName)
  const [templateDialogType, setTemplateDialogType] = useState(null) // 'samplingPointData' | 'geoPackage' | null

  const insertAndNotify = (category) => {
    dispatch(SurveyActions.surveyCategoryInserted(category))
    dispatch(SurveyActions.metaUpdated())
    onAdd(category)
  }

  const createSimpleCategory = async () => {
    const category = await API.createCategory({ surveyId })
    insertAndNotify(category)
  }

  const createTemplateCategory = async ({ locked }) => {
    const category = await API.createCategory({ surveyId })
    const categoryUuid = Category.getUuid(category)
    const categoryUpdated =
      templateDialogType === 'samplingPointData'
        ? await API.convertToSamplingPointDataCategory({ surveyId, categoryUuid, locked })
        : await API.convertToGeoPackageCategory({ surveyId, categoryUuid, locked })
    setTemplateDialogType(null)
    insertAndNotify(categoryUpdated)
  }

  if (!canEditSurvey) {
    // placeholder to avoid breaking the header layout
    return <div></div>
  }

  return (
    <>
      <ButtonMenu
        iconClassName="icon-plus icon-16px icon-left"
        label="categoryEdit.createCategory.menuLabel"
        items={[
          {
            key: 'simple',
            label: 'categoryEdit.createCategory.simple',
            onClick: createSimpleCategory,
          },
          ...(samplingPointDataCategory
            ? []
            : [
                {
                  key: 'sampling-point-data',
                  label: 'categoryEdit.createSamplingPointDataCategory.buttonLabel',
                  onClick: () => setTemplateDialogType('samplingPointData'),
                },
              ]),
          {
            key: 'geopackage',
            label: 'categoryEdit.createGeoPackageCategory.buttonLabel',
            onClick: () => setTemplateDialogType('geoPackage'),
          },
        ]}
        size="small"
      />

      {templateDialogType && (
        <LockFixedPropertiesDialog
          titleKey={
            templateDialogType === 'samplingPointData'
              ? 'categoryEdit.createSamplingPointDataCategory.buttonLabel'
              : 'categoryEdit.createGeoPackageCategory.buttonLabel'
          }
          messageKey={
            templateDialogType === 'samplingPointData'
              ? 'categoryEdit.createSamplingPointDataCategory.message'
              : 'categoryEdit.createGeoPackageCategory.message'
          }
          onClose={() => setTemplateDialogType(null)}
          onConfirm={createTemplateCategory}
        />
      )}

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
