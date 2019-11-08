import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import ItemsView from '../items/itemsView'
import CategoryEditView from '../categoryEdit/categoryEditView'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as CategoryEditState from '../categoryEdit/categoryEditState'

import {
  createCategory,
  deleteCategory,
  setCategoryForEdit,
} from '../categoryEdit/actions'

const CategoriesView = props => {

  const {
    categories, category, selectedItemUuid,
    createCategory, deleteCategory, setCategoryForEdit,
    onSelect, onClose, canSelect,
    readOnly
  } = props

  useEffect(() =>
    () => {
      if (category) {
        setCategoryForEdit(null)
      }
    }, [Category.getUuid(category)]
  )

  const i18n = useI18n()

  const canDeleteCategory = category => category.usedByNodeDefs
    ? alert(i18n.t('categoryEdit.cantBeDeleted'))
    : window.confirm(i18n.t('categoryEdit.confirmDelete', {
      categoryName: Category.getName(category) || i18n.t('common.undefinedName')
    }))

  return (
    <ItemsView
      headerText="Categories"
      itemEditComponent={CategoryEditView}
      itemEditProp="category"
      itemLabelFunction={category => Category.getName(category)}
      editedItem={category}
      items={categories}
      selectedItemUuid={selectedItemUuid}
      onAdd={createCategory}
      onEdit={setCategoryForEdit}
      canDelete={canDeleteCategory}
      onDelete={deleteCategory}
      canSelect={canSelect}
      onSelect={onSelect}
      onClose={onClose}
      readOnly={readOnly}/>
  )
}

const mapStateToProps = (state) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map(category => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))
    }))
  )(survey)

  return {
    categories,
    category: CategoryEditState.getCategoryForEdit(state),
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo)
  }
}

export default connect(
  mapStateToProps,
  {
    createCategory,
    deleteCategory,
    setCategoryForEdit,
  }
)(CategoriesView)
