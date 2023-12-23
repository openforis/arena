import './CategoryDetails.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router'
import classNames from 'classnames'

import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { Button, ButtonDownload, ButtonMenu } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import { Checkbox, OpenFileUploadDialogButton } from '@webapp/components/form'

import { ExtraPropDefsEditor } from '../ExtraPropDefsEditor'
import ImportSummary from './ImportSummary'
import LevelDetails from './LevelDetails'

import { State, useActions, useLocalState } from './store'

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
            <OpenFileUploadDialogButton
              className="import-btn"
              label="common.csvImport"
              accept=".csv"
              onOk={(files) => Actions.uploadCategory({ categoryUuid, file: files[0] })}
            />
          )}
          <ButtonDownload
            className="export-btn"
            testId={TestId.categoryDetails.exportBtn}
            href={`/api/survey/${surveyId}/categories/${categoryUuid}/export/`}
            label="common.csvExport"
          />
          {!readOnly && (
            <ButtonMenu
              className="date-import-template-menu-btn"
              label="categoryEdit.templateForDataImport"
              iconClassName="icon-download2 icon-14px"
              items={[
                {
                  key: 'data-import-template-download',
                  content: (
                    <ButtonDownload
                      className="btn-transparent"
                      testId={TestId.categoryDetails.templateForDataImportBtn}
                      href={`/api/survey/${surveyId}/categories/${categoryUuid}/import-template/`}
                      label="categoryEdit.templateForDataImport"
                    />
                  ),
                },
                {
                  key: 'data-import-generic-template-download',
                  content: (
                    <ButtonDownload
                      className="btn-transparent"
                      testId={TestId.categoryDetails.templateForDataImportGenericBtn}
                      href={`/api/survey/${surveyId}/categories/${categoryUuid}/import-template/`}
                      requestParams={{ generic: true }}
                      label="categoryEdit.templateForDataImportGeneric"
                    />
                  ),
                },
                {
                  key: 'data-import-sampling-point-data-template-download',
                  content: (
                    <ButtonDownload
                      className="btn-transparent"
                      testId={TestId.categoryDetails.templateForSamplingPointDataImportBtn}
                      href={`/api/survey/${surveyId}/categories/${categoryUuid}/import-template/`}
                      requestParams={{ samplingPointData: true }}
                      label="categoryEdit.templateForSamplingPointDataImport"
                    />
                  ),
                },
              ]}
            />
          )}

          {Category.isReportingData(category) && (
            <Checkbox
              checked
              className="reporting-data-checkbox"
              disabled={readOnly}
              label="categoryEdit.reportingData"
              onChange={Actions.convertToSimpleCategory}
            />
          )}
          {!readOnly && (
            <ButtonMenu
              iconClassName="icon-cog icon-14px"
              items={[
                ...(!Category.isReportingData(category)
                  ? [
                      {
                        key: 'convert-to-report-data-category',
                        label: 'categoryEdit.convertToReportingDataCategory.buttonLabel',
                        onClick: () => Actions.convertToReportingDataCategory({ categoryUuid, onCategoryUpdate }),
                      },
                    ]
                  : []),
                {
                  key: 'extra-props-editor',
                  label: 'extraProp.editor.title',
                  onClick: Actions.toggleEditExtraPropertiesPanel,
                },
              ]}
            />
          )}
        </div>

        {editingItemExtraDefs && (
          <ExtraPropDefsEditor
            toggleEditExtraPropsPanel={Actions.toggleEditExtraPropertiesPanel}
            extraPropDefs={Category.getItemExtraDefsArray(category)}
            isExtraPropDefReadOnly={(extraPropDef) => Category.isExtraPropDefReadOnly(extraPropDef)(category)}
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

        <div className="category__levels-wrapper">
          <div className={classNames('category__levels', { 'center-aligned': levels.length <= 3 })}>
            {levels.map((level) => (
              <LevelDetails
                key={CategoryLevel.getUuid(level)}
                level={level}
                state={state}
                setState={setState}
                single={levels.length === 1}
              />
            ))}

            {!readOnly && levels.length < MAX_LEVELS && (
              <div>
                <Button
                  className="btn-s btn-add-level"
                  testId={TestId.categoryDetails.addLevelBtn}
                  onClick={() => Actions.createLevel({ category })}
                  iconClassName="icon icon-plus icon-16px icon-left"
                  label="categoryEdit.addLevel"
                />
              </div>
            )}
          </div>
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
