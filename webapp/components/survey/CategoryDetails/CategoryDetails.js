import './CategoryDetails.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { FormItem, Input } from '@webapp/components/form/input'
import UploadButton from '@webapp/components/form/uploadButton'

import ImportSummary from './ImportSummary'
import LevelEdit from './LevelEdit'

import * as Actions from '../../../loggedin/surveyViews/category/actions'
import { State, useLocalState } from './store'

const CategoryDetails = (props) => {
  const { showClose, onCategoryCreated, categoryUuid: categoryUuidProp } = props

  const { categoryUuid } = useParams()
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const readOnly = !useAuthCanEditSurvey()

  const { state } = useLocalState({ onCategoryCreated, categoryUuid: categoryUuidProp })

  const category = State.getCategory(state)
  const importSummary = State.getImportSummary(state)

  const validation = Validation.getValidation(category)
  const levels = Category.getLevelsArray(category)

  const inCategoriesPath = Boolean(categoryUuid)

  return category ? (
    <>
      <div className="category">
        <div className="category__header">
          <FormItem label={i18n.t('categoryEdit.categoryName')}>
            <Input
              value={Category.getName(category)}
              validation={Validation.getFieldValidation(Category.props.name)(validation)}
              onChange={(value) =>
                dispatch(Actions.putCategoryProp(category, Category.props.name, StringUtils.normalizeName(value)))
              }
              readOnly={readOnly}
            />
          </FormItem>

          {!readOnly && (
            <UploadButton
              label={i18n.t('common.csvImport')}
              accept=".csv"
              onChange={(files) => dispatch(Actions.uploadCategory(Category.getUuid(category), files[0]))}
              disabled={Category.isPublished(category)}
            />
          )}
        </div>

        <div className="category__levels">
          {levels.map((level) => (
            <LevelEdit key={CategoryLevel.getUuid(level)} level={level} />
          ))}

          {!readOnly && (
            <button
              type="button"
              className="btn btn-s btn-add-level"
              onClick={() => dispatch(Actions.createCategoryLevel(category))}
              aria-disabled={levels.length === 5}
            >
              <span className="icon icon-plus icon-16px icon-left" />
              {i18n.t('categoryEdit.addLevel')}
            </button>
          )}
        </div>

        {showClose && (
          <div className="button-bar">
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (inCategoriesPath) {
                  history.goBack()
                }
              }}
            >
              {i18n.t('common.done')}
            </button>
          </div>
        )}
      </div>

      {importSummary && <ImportSummary summary={importSummary} />}
    </>
  ) : null
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
