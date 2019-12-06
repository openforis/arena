import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'
import ItemsView from '../items/itemsView'

import { createCategory, deleteCategory } from '../category/actions'

const CategoriesView = props => {
  const { categories, selectedItemUuid, createCategory, deleteCategory, onSelect, onClose, canSelect, readOnly } = props

  const i18n = useI18n()

  const canDeleteCategory = category =>
    category.usedByNodeDefs
      ? alert(i18n.t('categoryEdit.cantBeDeleted'))
      : window.confirm(
          i18n.t('categoryEdit.confirmDelete', {
            categoryName: Category.getName(category) || i18n.t('common.undefinedName'),
          }),
        )

  return (
    <ItemsView
      itemLabelFunction={category => Category.getName(category)}
      itemLink={appModuleUri(designerModules.category)}
      items={categories}
      selectedItemUuid={selectedItemUuid}
      onAdd={createCategory}
      canDelete={canDeleteCategory}
      onDelete={deleteCategory}
      canSelect={canSelect}
      onSelect={onSelect}
      onClose={onClose}
      readOnly={readOnly}
    />
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map(category => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)),
    })),
  )(survey)

  return {
    categories,
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps, {
  createCategory,
  deleteCategory,
})(CategoriesView)
