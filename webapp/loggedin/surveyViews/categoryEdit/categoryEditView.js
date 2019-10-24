import './components/categoryEditView.scss'

import React from 'react'
import { connect } from 'react-redux'

import StringUtils from '@core/stringUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem, Input } from '@webapp/commonComponents/form/input'
import UploadButton from '@webapp/commonComponents/form/uploadButton'
import LevelEdit from './components/levelEdit'
import CategoryImportSummary from './components/categoryImportSummary'

import Category from '@core/survey/category'
import CategoryLevel from '@core/survey/categoryLevel'
import Validation from '@core/validation/validation'
import Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as CategoryEditState from './categoryEditState'

import { putCategoryProp, createCategoryLevel, setCategoryForEdit, uploadCategory } from './actions'

const CategoryEditView = props => {

  const {
    category, readOnly, importSummary,
    putCategoryProp, createCategoryLevel, setCategoryForEdit, uploadCategory,
  } = props

  const validation = Validation.getValidation(category)
  const levels = Category.getLevelsArray(category)

  const i18n = useI18n()

  return (
    <>
      <div className="category-edit">
        <div className="category-edit__header">
          <FormItem label={i18n.t('categoryEdit.categoryName')}>
            <Input value={Category.getName(category)}
                   validation={Validation.getFieldValidation(Category.props.name)(validation)}
                   onChange={value => putCategoryProp(category, Category.props.name, StringUtils.normalizeName(value))}
                   readOnly={readOnly}/>

          </FormItem>

          {!readOnly &&
          <UploadButton
            label={i18n.t('common.csvImport')}
            accept=".csv"
            onChange={(files) => uploadCategory(Category.getUuid(category), files[0])}
            disabled={Category.isPublished(category)}
          />
          }
        </div>

        <div className="category-edit__levels">
          {
            levels.map(level =>
              <LevelEdit key={CategoryLevel.getUuid(level)}
                         level={level}/>
            )
          }

          {
            !readOnly &&
            <button className="btn btn-s btn-add-level"
                    onClick={() => createCategoryLevel(category)}
                    aria-disabled={levels.length === 5}>
              <span className="icon icon-plus icon-16px icon-left"/>
              {i18n.t('categoryEdit.addLevel')}
            </button>
          }
        </div>

        <div style={{ justifySelf: 'center' }}>
          <button className="btn"
                  onClick={() => setCategoryForEdit(null)}>
            {i18n.t('common.done')}
          </button>
        </div>

      </div>

      {
        importSummary &&
        <CategoryImportSummary summary={importSummary}/>
      }

    </>

  )
}

const mapStateToProps = state => ({
  readOnly: !Authorizer.canEditSurvey(AppState.getUser(state), SurveyState.getSurveyInfo(state)),
  importSummary: CategoryEditState.getImportSummary(state)
})

export default connect(
  mapStateToProps,
  {
    putCategoryProp,
    createCategoryLevel,
    setCategoryForEdit,
    uploadCategory,
  }
)(CategoryEditView)
