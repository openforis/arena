import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import ErrorBadge from '../../../../commonComponents/errorBadge'
import ItemEdit from './itemEdit'

import { normalizeName } from '../../../../../common/stringUtils'

import Survey from '../../../../../common/survey/survey'
import Category from '../../../../../common/survey/category'
import CategoryLevel from '../../../../../common/survey/categoryLevel'
import CategoryItem from '../../../../../common/survey/categoryItem'
import { getFieldValidation } from '../../../../../common/validation/validator'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../../surveyForm/surveyFormState'

import { canEditSurvey } from '../../../../../common/auth/authManager'

import {
  getCategoryEditLevelActiveItem,
  getCategoryForEdit,
  getCategoryEditLevelItemsArray,
} from '../categoryEditState'

import { createCategoryLevelItem } from '../actions'
import { putCategoryItemProp, putCategoryLevelProp } from '../actions'
import { deleteCategoryItem, deleteCategoryLevel, setCategoryItemForEdit } from '../actions'


class LevelEdit extends React.Component {

  handleDelete () {
    const {survey, category, level, deleteCategoryLevel} = this.props

    const nodeDefsCode = Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)
    if (R.any(def => Survey.getNodeDefCategoryLevelIndex(def)(survey) >= CategoryLevel.getIndex(level))(nodeDefsCode)) {
      alert('This category level is used by some node definitions and cannot be removed')
    } else if (confirm('Delete the level with all items? This operation cannot be undone')) {
      deleteCategoryLevel(category, level)
    }
  }

  render () {
    const {
      category, level, parentItem, items, activeItemUuid, canAddItem,
      canBeDeleted, language,
      createCategoryLevelItem, putCategoryLevelProp, putCategoryItemProp,
      setCategoryItemForEdit, deleteCategoryItem, readOnly,
    } = this.props

    const validation = Category.getLevelValidation(CategoryLevel.getIndex(level))(category)

    return <div className="category-edit__level">

      <div className="category-edit__level-header">
        <h4 className="label">
          <ErrorBadge validation={validation}/>
          Level {level.index + 1}
        </h4>
        {
          !readOnly &&
          <button className="btn btn-s btn-of-light-xs"
                  onClick={() => this.handleDelete()}
                  aria-disabled={!canBeDeleted}>
            <span className="icon icon-bin2 icon-12px"/>
          </button>
        }
      </div>

      <FormItem label={'name'}>
        <Input value={CategoryLevel.getName(level)}
               validation={getFieldValidation('name')(validation)}
               onChange={value => putCategoryLevelProp(category, level, 'name', normalizeName(value))}
               readOnly={readOnly}/>
      </FormItem>

      <div className="category-edit__level-items-header">
        <h5 className="label">Items</h5>
        {
          !readOnly &&
          <button className="btn btn-s btn-of-light-xs btn-add-item"
                  aria-disabled={!canAddItem}
                  onClick={() => createCategoryLevelItem(category, level, parentItem)}>
            <span className="icon icon-plus icon-12px icon-left"/>
            ADD
          </button>
        }
      </div>

      <div className="category-edit__level-items">
        {
          items.map(item =>
            <ItemEdit key={CategoryItem.getUuid(item)}
                      language={language}
                      category={category}
                      level={level}
                      item={item}
                      active={CategoryItem.getUuid(item) === activeItemUuid}
                      putCategoryItemProp={putCategoryItemProp}
                      setCategoryItemForEdit={setCategoryItemForEdit}
                      deleteCategoryItem={deleteCategoryItem}
                      readOnly={readOnly}/>
          )
        }
      </div>
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props
  const {index} = level

  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const language = Survey.getDefaultLanguage(surveyInfo)

  const category = getCategoryForEdit(survey)(surveyForm)
  const activeItem = getCategoryEditLevelActiveItem(index)(surveyForm)
  const parentItem = getCategoryEditLevelActiveItem(index - 1)(surveyForm)

  const canAddItem = index === 0 || parentItem
  const items = canAddItem ? getCategoryEditLevelItemsArray(index)(surveyForm) : []
  const canBeDeleted = Category.isLevelDeleteAllowed(level)(category)

  const user = AppState.getUser(state)

  return {
    language,
    category,
    items,
    activeItemUuid: activeItem ? CategoryItem.getUuid(activeItem) : null,
    parentItem,
    canAddItem,
    canBeDeleted,
    readOnly: !canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps, {
  createCategoryLevelItem,
  putCategoryLevelProp,
  putCategoryItemProp,
  deleteCategoryLevel,
  setCategoryItemForEdit,
  deleteCategoryItem,
})(LevelEdit)

