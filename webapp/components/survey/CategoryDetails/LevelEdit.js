import React from 'react'
import * as R from 'ramda'
import { connect, useDispatch } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import { normalizeName } from '@core/stringUtils'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import { FormItem, Input } from '@webapp/components/form/input'
import ErrorBadge from '@webapp/components/errorBadge'
import { useI18n } from '@webapp/store/system'

import * as CategoryState from '../../../loggedin/surveyViews/category/categoryState'

import {
  createCategoryLevelItem,
  putCategoryItemProp,
  putCategoryLevelProp,
  deleteCategoryItem,
  deleteCategoryLevel,
  setCategoryItemForEdit,
} from '../../../loggedin/surveyViews/category/actions'

import ItemEdit from './ItemEdit'
import { UserState } from '@webapp/store/user'

const LevelEdit = (props) => {
  const dispatch = useDispatch()

  const handleDelete = () => {
    const { category, level, usedByNodeDefs, deleteCategoryLevel } = props

    if (usedByNodeDefs) {
      dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeletedLevel' }))
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'categoryEdit.confirmDeleteLevel',
          params: { levelName: CategoryLevel.getName(level) },
          onOk: () => deleteCategoryLevel(category, level),
        })
      )
    }
  }

  const {
    surveyInfo,
    category,
    level,
    parentItem,
    items,
    activeItemUuid,
    canAddItem,
    canBeDeleted,
    createCategoryLevelItem,
    putCategoryLevelProp,
    putCategoryItemProp,
    setCategoryItemForEdit,
    deleteCategoryItem,
    readOnly,
  } = props

  const validation = Category.getLevelValidation(CategoryLevel.getIndex(level))(category)

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  return (
    <div className="category__level">
      <div className="category__level-header">
        <h4 className="label">
          <ErrorBadge validation={validation} />
          {i18n.t('categoryEdit.level')} {level.index + 1}
        </h4>
        {!readOnly && (
          <button className="btn btn-s" onClick={() => handleDelete()} aria-disabled={!canBeDeleted}>
            <span className="icon icon-bin2 icon-12px" />
          </button>
        )}
      </div>

      <FormItem label={i18n.t('common.name')}>
        <Input
          value={CategoryLevel.getName(level)}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={(value) => putCategoryLevelProp(category, level, 'name', normalizeName(value))}
          readOnly={readOnly}
        />
      </FormItem>

      <div className="category__level-items-header">
        <h5 className="label">{i18n.t('common.item_plural')}</h5>
        {!readOnly && (
          <button
            className="btn btn-s btn-add-item"
            aria-disabled={!canAddItem}
            onClick={() => createCategoryLevelItem(category, level, parentItem)}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
        )}
      </div>

      <div className="category__level-items">
        {items.map((item) => (
          <ItemEdit
            key={CategoryItem.getUuid(item)}
            lang={lang}
            category={category}
            level={level}
            item={item}
            active={CategoryItem.getUuid(item) === activeItemUuid}
            putCategoryItemProp={putCategoryItemProp}
            setCategoryItemForEdit={setCategoryItemForEdit}
            deleteCategoryItem={deleteCategoryItem}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

const mapStateToProps = (state, props) => {
  const { level } = props
  const { index } = level

  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  const category = CategoryState.getCategoryForEdit(state)
  const activeItem = CategoryState.getLevelActiveItem(index)(state)
  const parentItem = CategoryState.getLevelActiveItem(index - 1)(state)

  const canAddItem = index === 0 || parentItem
  const items = canAddItem ? CategoryState.getLevelItemsArray(index)(state) : []
  const canBeDeleted = Category.isLevelDeleteAllowed(level)(category)
  const nodeDefsCode = Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)
  const usedByNodeDefs = R.any((def) => Survey.getNodeDefCategoryLevelIndex(def)(survey) >= index)(nodeDefsCode)

  const user = UserState.getUser(state)

  return {
    surveyInfo,
    category,
    items,
    activeItemUuid: activeItem ? CategoryItem.getUuid(activeItem) : null,
    parentItem,
    canAddItem,
    canBeDeleted,
    usedByNodeDefs,
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
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
