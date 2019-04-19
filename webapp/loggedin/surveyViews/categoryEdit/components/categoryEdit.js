import './categoryEdit.scss'

import React from 'react'
import { connect } from 'react-redux'

import { normalizeName } from '../../../../../common/stringUtils'

import LevelEdit from './levelEdit'
import { FormItem, Input } from '../../../../commonComponents/form/input'

import Category from '../../../../../common/survey/category'
import CategoryLevel from '../../../../../common/survey/categoryLevel'
import { getFieldValidation } from '../../../../../common/validation/validator'

import { getUser } from '../../../../app/appState'
import { getStateSurveyInfo } from '../../../../survey/surveyState'

import { putCategoryProp, createCategoryLevel, setCategoryForEdit } from '../actions'

import { canEditSurvey } from '../../../../../common/auth/authManager'

const CategoryEdit = props => {

  const {
    category, readOnly,
    putCategoryProp, createCategoryLevel, setCategoryForEdit,
  } = props

  const {validation} = category
  const levels = Category.getLevelsArray(category)

  return (
    <div className="category-edit">
      <div>
        <FormItem label="Category name">
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
          <button className="btn btn-s btn-of-light-xs btn-add-level"
                  onClick={() => createCategoryLevel(category)}
                  aria-disabled={levels.length === 5}>
            <span className="icon icon-plus icon-16px icon-left"/>
            ADD LEVEL
          </button>
        }
      </div>

      <div style={{justifySelf: 'center'}}>
        <button className="btn btn-of-light"
                onClick={() => setCategoryForEdit(null)}>
          Done
        </button>
      </div>

    </div>
  )
}

const mapStateToProps = state => ({
  readOnly: !canEditSurvey(getUser(state), getStateSurveyInfo(state)),
})

export default connect(
  mapStateToProps,
  {
    putCategoryProp,
    createCategoryLevel,
    setCategoryForEdit,
  }
)(CategoryEdit)
