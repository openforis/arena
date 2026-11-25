import { useState } from 'react'
import { useNavigate } from 'react-router'

import * as Category from '@core/survey/category'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { Button, ButtonMenu } from '@webapp/components/buttons'
import { ButtonMenuExport } from '@webapp/components/buttons/ButtonMenuExport'
import { UploadButton } from '@webapp/components/form'
import { useIsCategoriesRoute } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { SurveyActions, useCategoryByName, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { CategoryCloneFromSurveyDialog } from '../CategoryCloneFromSurveyDialog'
import { State, useActions } from '../store'

type TableHeaderLeftProps = {
  headerProps?: Record<string, any>
}

const TableHeaderLeft = (props: TableHeaderLeftProps) => {
  const { headerProps = {} } = props
  const { state, setState } = headerProps
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const i18n = useI18n()
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

  const samplingPointDataCategory = useCategoryByName(Category.samplingPointDataCategoryName)

  const insertAndNotify = (category) => {
    dispatch(SurveyActions.surveyCategoryInserted(category))
    dispatch(SurveyActions.metaUpdated())
    onAdd(category)
  }

  const createSimpleCategory = async () => {
    const category = await API.createCategory({ surveyId })
    insertAndNotify(category)
  }

  // the extra prop(s) added by these templates are always locked: there is no meaningful
  // reason to leave them unlocked right after creating the category from a template
  const createTemplateCategory = async (templateType) => {
    const category = await API.createCategory({ surveyId })
    const categoryUuid = Category.getUuid(category)
    const categoryUpdated =
      templateType === 'samplingPointData'
        ? await API.convertToSamplingPointDataCategory({ surveyId, categoryUuid })
        : await API.convertToGeoPackageCategory({ surveyId, categoryUuid })
    insertAndNotify(categoryUpdated)
  }

  const confirmCreateTemplateCategory = (templateType) => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key:
          templateType === 'samplingPointData'
            ? 'categoryEdit.createSamplingPointDataCategory.message'
            : 'categoryEdit.createGeoPackageCategory.message',
        onOk: () => createTemplateCategory(templateType),
      })
    )
  }

  if (!canEditSurvey) {
    // placeholder to avoid breaking the header layout
    return <div></div>
  }

  const categoryTypeMenuItemContent = ({ labelKey, descriptionKey }) => (
    <div className="button-menu__item-with-description">
      <span className="button-menu__item-label">{i18n.t(labelKey)}</span>
      <span className="button-menu__item-description">{i18n.t(descriptionKey)}</span>
    </div>
  )

  return (
    <>
      <span className="category-list__add-category-btn-group" style={{ display: 'inline-flex' }}>
        <Button
          className="btn-add-category"
          iconClassName="icon-plus icon-16px icon-left"
          label="categoryEdit.createCategory.menuLabel"
          onClick={createSimpleCategory}
          size="small"
        />
        <ButtonMenu
          testId="btn-add-category-type-menu"
          title="categoryEdit.createCategory.otherTypes"
          items={[
            ...(samplingPointDataCategory
              ? []
              : [
                  {
                    key: 'sampling-point-data',
                    content: categoryTypeMenuItemContent({
                      labelKey: 'categoryEdit.createSamplingPointDataCategory.buttonLabel',
                      descriptionKey: 'categoryEdit.createSamplingPointDataCategory.description',
                    }),
                    onClick: () => confirmCreateTemplateCategory('samplingPointData'),
                  },
                ]),
            {
              key: 'geopackage',
              content: categoryTypeMenuItemContent({
                labelKey: 'categoryEdit.createGeoPackageCategory.buttonLabel',
                descriptionKey: 'categoryEdit.createGeoPackageCategory.description',
              }),
              onClick: () => confirmCreateTemplateCategory('geoPackage'),
            },
          ]}
          size="small"
        />
      </span>

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

export default TableHeaderLeft
