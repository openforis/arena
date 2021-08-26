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
import { DataTestId } from '@webapp/utils/dataTestId'

import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
import UploadButton from '@webapp/components/form/uploadButton'
import DownloadButton from '@webapp/components/form/downloadButton'

import ImportSummary from './ImportSummary'
import LevelDetails from './LevelDetails'

import { State, useActions, useLocalState } from './store'

const CategoryDetails = (props) => {
  const { showClose, onCategoryCreated, categoryUuid: categoryUuidProp } = props

  const { categoryUuid: categoryUuidParam } = useParams()
  const i18n = useI18n()
  const surveyId = useSurveyId()

  const readOnly = !useAuthCanEditSurvey()

  const { state, setState } = useLocalState({ onCategoryCreated, categoryUuid: categoryUuidProp || categoryUuidParam })
  const Actions = useActions({ setState })

  const category = State.getCategory(state)
  const importSummary = State.getImportSummary(state)

  const validation = Validation.getValidation(category)
  const levels = Category.getLevelsArray(category)

  if (!category) return null

  return (
    <>
      <div className="category">
        <div className="category__header">
          <FormItem label={i18n.t('categoryEdit.categoryName')}>
            <Input
              id={DataTestId.categoryDetails.categoryName}
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
              onChange={(files) => Actions.uploadCategory({ categoryUuid: Category.getUuid(category), file: files[0] })}
              disabled={Category.isPublished(category)}
            />
          )}
          <DownloadButton
            id={DataTestId.categoryDetails.exportBtn}
            href={`/api/survey/${surveyId}/categories/${Category.getUuid(category)}/export/`}
            label={i18n.t('common.csvExport')}
          />
        </div>

        <div className="category__levels">
          {levels.map((level) => (
            <LevelDetails key={CategoryLevel.getUuid(level)} level={level} state={state} setState={setState} />
          ))}

          {!readOnly && (
            <Button
              className="btn-s btn-add-level"
              testId={DataTestId.categoryDetails.addLevelBtn}
              onClick={() => Actions.createLevel({ category })}
              disabled={levels.length === 5}
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
  onCategoryCreated: PropTypes.func,
  showClose: PropTypes.bool,
}

CategoryDetails.defaultProps = {
  categoryUuid: null,
  onCategoryCreated: null,
  showClose: true,
}

export default CategoryDetails
