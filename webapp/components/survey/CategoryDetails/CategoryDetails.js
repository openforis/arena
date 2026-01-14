import './CategoryDetails.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router'
import classNames from 'classnames'

import { FileFormats } from '@core/fileFormats'
import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Validation from '@core/validation/validation'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import { FileUtils } from '@webapp/utils/fileUtils'

import { Button, ButtonDownload, ButtonMenu } from '@webapp/components'
import { ButtonMenuExport } from '@webapp/components/buttons/ButtonMenuExport'
import { FormItem, Input } from '@webapp/components/form/Input'
import { Checkbox, OpenFileUploadDialogButton } from '@webapp/components/form'

import { ExtraPropDefsEditorPanel } from '../ExtraPropDefsEditor'
import ImportSummary from './ImportSummary'
import LevelDetails from './LevelDetails'

import { State, useActions, useLocalState } from './store'

const MAX_LEVELS = 5

const allowedImportExtensions = '.csv,.xlsx'

const templateFileFormats = [FileFormats.csv, FileFormats.xlsx]

const templateTypes = {
  specificDataImport: 'specificDataImport',
  genericDataImport: 'genericDataImport',
  samplingPointDataImport: 'samplingPointDataImport',
}

const getTemplateExportTileType = (templateType) => {
  switch (templateType) {
    case templateTypes.genericDataImport:
      return 'CategoryImportGeneric'
    case templateTypes.specificDataImport:
      return 'CategoryImport'
    case templateTypes.samplingPointDataImport:
      return 'SamplingPointDataImport'
    default:
      return 'CategoryImport'
  }
}

const getExportFileNameGenerator =
  ({ surveyName, category }) =>
  ({ fileFormat }) =>
    ExportFileNameGenerator.generate({
      surveyName,
      fileType: 'Category',
      fileFormat,
      itemName: Category.getName(category),
    })

const getTemplateExportFileName = ({ surveyName, templateType, fileFormat }) =>
  ExportFileNameGenerator.generate({
    surveyName,
    fileType: getTemplateExportTileType(templateType),
    fileFormat,
  })

const CategoryDetails = (props) => {
  const { categoryUuid: categoryUuidProp, onCategoryUpdate, showClose = true } = props

  const { categoryUuid: categoryUuidParam } = useParams()
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const surveyName = Survey.getName(surveyInfo)

  const readOnly = !useAuthCanEditSurvey()

  const { state, setState } = useLocalState({
    categoryUuid: categoryUuidProp || categoryUuidParam,
    onCategoryUpdate,
  })
  const Actions = useActions({ setState })

  const category = State.getCategory(state)

  if (!category) return null

  const categoryUuid = Category.getUuid(category)
  const itemsCount = Category.getItemsCountOrLevelsItemsCount(category)
  const excelExportDisabled = itemsCount > FileUtils.excelRowsLimit

  const importSummary = State.getImportSummary(state)
  const editingItemExtraDefs = State.isEditingItemExtraDefs(state)

  const validation = Validation.getValidation(category)
  const levels = Category.getLevelsArray(category)

  return (
    <>
      <div className="category">
        <div className="category__header">
          <div className="row">
            <FormItem label="categoryEdit.categoryName">
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
              <>
                <OpenFileUploadDialogButton
                  className="import-btn"
                  label="common.import"
                  accept={allowedImportExtensions}
                  onOk={({ files, onUploadProgress }) =>
                    Actions.uploadCategory({ categoryUuid, file: files[0], onUploadProgress })
                  }
                />
                <ButtonMenu
                  className="date-import-template-menu-btn"
                  label="categoryEdit.templateForImport"
                  iconClassName="icon-download2 icon-14px"
                  items={Object.keys(templateTypes).flatMap((templateType) =>
                    templateFileFormats.map((fileFormat) => ({
                      key: `data-import-template-${templateType}-${fileFormat}`,
                      content: (
                        <ButtonDownload
                          fileName={getTemplateExportFileName({ surveyName, templateType, fileFormat })}
                          href={`/api/survey/${surveyId}/categories/${categoryUuid}/import-template/`}
                          requestParams={{
                            fileFormat,
                            generic: templateType === templateTypes.genericDataImport,
                            samplingPointData: templateType === templateTypes.samplingPointDataImport,
                          }}
                          label={`categoryEdit.templateFor_${templateType}_${fileFormat}`}
                          variant="text"
                        />
                      ),
                    }))
                  )}
                  variant="outlined"
                />
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
              </>
            )}
          </div>

          <div className="row">
            <FormItem info="common.designerNotesInfo" label="common.designerNotes">
              <Input
                inputType="textarea"
                onChange={(value) => Actions.updateCategoryProp({ key: Category.keysProps.designerNotes, value })}
                readOnly={readOnly}
                textAreaRows={2}
                validation={Validation.getFieldValidation(Category.keysProps.designerNotes)(validation)}
                value={Category.getDesignerNotes(category)}
              />
            </FormItem>

            <ButtonMenuExport
              className="export-btn"
              excelExportDisabled={excelExportDisabled}
              fileNameGenerator={getExportFileNameGenerator({ surveyName, category })}
              href={`/api/survey/${surveyId}/categories/${categoryUuid}/export/`}
              testId={TestId.categoryDetails.exportBtn}
            />

            {Category.isReportingData(category) && (
              <Checkbox
                checked
                className="reporting-data-checkbox"
                disabled={readOnly}
                label="categoryEdit.reportingData"
                onChange={Actions.convertToSimpleCategory}
              />
            )}
          </div>
        </div>

        {editingItemExtraDefs && (
          <ExtraPropDefsEditorPanel
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
            <Button onClick={Actions.onDoneClick} label="common.done" primary />
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

export default CategoryDetails
