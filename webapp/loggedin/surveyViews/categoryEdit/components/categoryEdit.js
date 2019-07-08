import './categoryEdit.scss'

import React from 'react'
import { connect } from 'react-redux'

import { normalizeName } from '../../../../../common/stringUtils'

import LevelEdit from './levelEdit'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import useI18n from '../../../../commonComponents/useI18n'

import Category from '../../../../../common/survey/category'
import CategoryLevel from '../../../../../common/survey/categoryLevel'
import { getFieldValidation } from '../../../../../common/validation/validator'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

import { putCategoryProp, createCategoryLevel, setCategoryForEdit } from '../actions'

import Authorizer from '../../../../../common/auth/authorizer'

const CategoryEdit = props => {

  const {
    category, readOnly,
    putCategoryProp, createCategoryLevel, setCategoryForEdit,
  } = props

  const { validation } = category
  const levels = Category.getLevelsArray(category)

  const i18n = useI18n()

  return (
    <div className="category-edit">
      <div>
        <FormItem label={i18n.t('categoryEdit.categoryName')}>
          <Input value={Category.getName(category)}
                 validation={getFieldValidation('name')(validation)}
                 onChange={value => putCategoryProp(category, 'name', normalizeName(value))}
                 readOnly={readOnly}/>
        </FormItem>
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
  )
}

const mapStateToProps = state => ({
  readOnly: !Authorizer.anEditSurvey(AppState.getUser(state), SurveyState.getSurveyInfo(state)),
})

export default connect(
  mapStateToProps,
  {
    putCategoryProp,
    createCategoryLevel,
    setCategoryForEdit,
  }
)(CategoryEdit)
