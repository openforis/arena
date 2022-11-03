import './CategoryDetails.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { Button, ButtonDownload, ButtonMenu } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
import { Checkbox, UploadButton } from '@webapp/components/form'

import ImportSummary from './ImportSummary'
import LevelDetails from './LevelDetails'

import { State, useActions, useLocalState } from './store'
import { ExtraPropDefsEditor } from '../ExtraPropDefsEditor'

const MAX_LEVELS = 5

const CategoryDetails = (props) => {
  const { showClose, onCategoryUpdate, categoryUuid: categoryUuidProp } = props

  const { categoryUuid: categoryUuidParam } = useParams()
  const i18n = useI18n()
  const surveyId = useSurveyId()

  const readOnly = !useAuthCanEditSurvey()

  const { state, setState } = useLocalState({
    categoryUuid: categoryUuidProp || categoryUuidParam,
    onCategoryUpdate,
  })
  const Actions = useActions({ setState })

  const category = State.getCategory(state)

  if (!category) return null

  const categoryUuid = Category.getUuid(category)

  const importSummary = State.getImportSummary(state)
  const editingItemExtraDefs = State.isEditingItemExtraDefs(state)

  const validation = Validation.getValidation(category)
  const levels = Category.getLevelsArray(category)

  return (
    <>
      <div className="category">
        <div className="category__header">
          <FormItem label={i18n.t('categoryEdit.categoryName')}>
            <Input
              id={TestId.categoryDetails.categoryName}
              value={Category.getName(category)}
              validation={Validation.getFieldValidation(Category.keysProps.name)(validation)}
              onChange={(value) =>
                Actions.updateCategoryProp({ key: Category.keysProps.name, value: StringUtils.normalizeName(value) })
              }
              readOnly={readOnly}
            />
          </FormItem>

          {!readOnly && (
            <UploadButton
              label={i18n.t('common.csvImport')}
              accept=".csv"
              onChange={(files) => Actions.uploadCategory({ categoryUuid, file: files[0] })}
            />
          )}
          <ButtonDownload
            testId={TestId.categoryDetails.exportBtn}
            href={`/api/survey/${surveyId}/categories/${categoryUuid}/export/`}
            label="common.csvExport"
          />
          <ButtonMenu
            label="categoryEdit.templateForDataImport"
            iconClassName="icon-download2 icon-14px"
            popupComponent={
              <>
                <ButtonDownload
                  className="btn-transparent"
                  testId={TestId.categoryDetails.templateForDataImportBtn}
                  href={`/api/survey/${surveyId}/categories/${categoryUuid}/import-template/`}
                  label="categoryEdit.templateForDataImport"
                />
                <ButtonDownload
                  className="btn-transparent"
                  testId={TestId.categoryDetails.templateForDataImportGenericBtn}
                  href={`/api/survey/${surveyId}/categories/${categoryUuid}/import-template/`}
                  requestParams={{ generic: true }}
                  label="categoryEdit.templateForDataImportGeneric"
                />
              </>
            }
          />

          {Category.isReportingData(category) && (
            <FormItem label={i18n.t('categoryEdit.reportingData')} className="check">
              <Checkbox checked disabled={readOnly} onChange={Actions.convertToSimpleCategory} />
            </FormItem>
          )}
          {!readOnly && !Category.isReportingData(category) && (
            <ButtonMenu
              iconClassName="icon-cog icon-14px"
              popupComponent={
                <>
                  <Button
                    className="btn-transparent"
                    label="categoryEdit.convertToReportingDataCategory.buttonLabel"
                    onClick={() => Actions.convertToReportingDataCategory({ categoryUuid, onCategoryUpdate })}
                  />
                  <Button
                    className="btn-transparent"
                    label="extraProp.editor.title"
                    onClick={Actions.toggleEditExtraPropertiesPanel}
                  />
                </>
              }
            />
          )}
        </div>

        {editingItemExtraDefs && (
          <ExtraPropDefsEditor
            toggleEditExtraPropsPanel={Actions.toggleEditExtraPropertiesPanel}
            extraPropDefs={Category.getItemExtraDefsArray(category)}
            onExtraPropDefDelete={({ propName }) =>
              Actions.updateCategoryItemExtraPropItem({
                categoryUuid,
                name: propName,
                deleted: true,
              })
            }
            onExtraPropDefUpdate={({ propName, extraPropDef }) =>
              Actions.updateCategoryItemExtraPropItem({
                categoryUuid,
                name: propName,
                itemExtraDef: extraPropDef,
              })
            }
          />
        )}

        <div className="category__levels">
          {levels.map((level) => (
            <LevelDetails
              key={CategoryLevel.getUuid(level)}
              level={level}
              state={state}
              setState={setState}
              single={levels.length === 1}
            />
          ))}

          {!readOnly && (
            <Button
              className="btn-s btn-add-level"
              testId={TestId.categoryDetails.addLevelBtn}
              onClick={() => Actions.createLevel({ category })}
              disabled={levels.length === MAX_LEVELS}
              iconClassName="icon icon-plus icon-16px icon-left"
              label="categoryEdit.addLevel"
            />
          )}
        </div>

        {showClose && (
          <div className="button-bar">
            <Button onClick={Actions.onDoneClick} label="common.done" />
          </div>
        )}
      </div>

      {importSummary && <ImportSummary state={state} setState={setState} />}
    </>
  )
}

CategoryDetails.propTypes = {
  categoryUuid: PropTypes.string,
  onCategoryUpdate: PropTypes.func,
  showClose: PropTypes.bool,
}

CategoryDetails.defaultProps = {
  categoryUuid: null,
  onCategoryUpdate: null,
  showClose: true,
}

export default CategoryDetails
