import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import ErrorBadge from '../../../../commonComponents/errorBadge'
import useI18n from '../../../../commonComponents/useI18n'
import ItemEdit from './itemEdit'

import { normalizeName } from '../../../../../common/stringUtils'

import Survey from '../../../../../common/survey/survey'
import Category from '../../../../../common/survey/category'
import CategoryLevel from '../../../../../common/survey/categoryLevel'
import CategoryItem from '../../../../../common/survey/categoryItem'
import Validator from '../../../../../common/validation/validator'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'
import * as CategoryEditState from '../categoryEditState'

import { canEditSurvey } from '../../../../../common/auth/authManager'

import {
  createCategoryLevelItem,
  putCategoryItemProp,
  putCategoryLevelProp,
  deleteCategoryItem,
  deleteCategoryLevel,
  setCategoryItemForEdit,
} from '../actions'

const LevelEdit = props => {

  const handleDelete = () => {
    const { survey, category, level, deleteCategoryLevel } = props

    const nodeDefsCode = Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)
    if (R.any(def => Survey.getNodeDefCategoryLevelIndex(def)(survey) >= CategoryLevel.getIndex(level))(nodeDefsCode)) {
      alert('This category level is used by some node definitions and cannot be removed')
    } else if (confirm('Delete the level with all items? This operation cannot be undone')) {
      deleteCategoryLevel(category, level)
    }
  }

  const {
    surveyInfo,
    category, level, parentItem, items, activeItemUuid, canAddItem,
    canBeDeleted,
    createCategoryLevelItem, putCategoryLevelProp, putCategoryItemProp,
    setCategoryItemForEdit, deleteCategoryItem, readOnly,
  } = props

  const validation = Category.getLevelValidation(CategoryLevel.getIndex(level))(category)

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  return <div className="category-edit__level">

    <div className="category-edit__level-header">
      <h4 className="label">
        <ErrorBadge validation={validation}/>
        {i18n.t('categoryEdit.level')} {level.index + 1}
      </h4>
      {
        !readOnly &&
        <button className="btn btn-s"
                onClick={() => handleDelete()}
                aria-disabled={!canBeDeleted}>
          <span className="icon icon-bin2 icon-12px"/>
        </button>
      }
    </div>

    <FormItem label={i18n.t('common.name')}>
      <Input value={CategoryLevel.getName(level)}
             validation={Validator.getFieldValidation('name')(validation)}
             onChange={value => putCategoryLevelProp(category, level, 'name', normalizeName(value))}
             readOnly={readOnly}/>
    </FormItem>

    <div className="category-edit__level-items-header">
      <h5 className="label">{i18n.t('common.item_plural')}</h5>
      {
        !readOnly &&
        <button className="btn btn-s btn-add-item"
                aria-disabled={!canAddItem}
                onClick={() => createCategoryLevelItem(category, level, parentItem)}>
          <span className="icon icon-plus icon-12px icon-left"/>
          {i18n.t('common.add')}
        </button>
      }
    </div>

    <div className="category-edit__level-items">
      {
        items.map(item =>
          <ItemEdit key={CategoryItem.getUuid(item)}
                    lang={lang}
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

const mapStateToProps = (state, props) => {
  const { level } = props
  const { index } = level

  const surveyInfo = SurveyState.getSurveyInfo(state)

  const category = CategoryEditState.getCategoryForEdit(state)
  const activeItem = CategoryEditState.getLevelActiveItem(index)(state)
  const parentItem = CategoryEditState.getLevelActiveItem(index - 1)(state)

  const canAddItem = index === 0 || parentItem
  const items = canAddItem ? CategoryEditState.getLevelItemsArray(index)(state) : []
  const canBeDeleted = Category.isLevelDeleteAllowed(level)(category)

  const user = AppState.getUser(state)

  return {
    surveyInfo,
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

