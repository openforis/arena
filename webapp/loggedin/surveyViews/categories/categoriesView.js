import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as NodeDefEditState from '@webapp/loggedin/surveyViews/nodeDefEdit/nodeDefEditState'
import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'

import { putNodeDefProp } from '@webapp/survey/nodeDefs/actions'
import { createCategory, deleteCategory } from '../category/actions'
import ItemsView from '../items/itemsView'

const CategoriesView = props => {
  const { categories, nodeDef, createCategory, deleteCategory, canSelect, readOnly, putNodeDefProp } = props
  const selectedItemUuid = nodeDef && NodeDef.getCategoryUuid(nodeDef)

  const i18n = useI18n()
  const history = useHistory()

  const onClose = nodeDef ? history.goBack : null

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
      onSelect={category => putNodeDefProp(nodeDef, NodeDef.propKeys.categoryUuid, Category.getUuid(category))}
      onClose={onClose}
      readOnly={readOnly}
    />
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const readOnly = !Authorizer.canEditSurvey(user, surveyInfo)
  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map(category => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)),
    })),
  )(survey)
  // A nodeDef code is begin edited.
  const nodeDef = !readOnly && NodeDefEditState.getNodeDef(state)
  const canSelect = nodeDef && NodeDef.isCode(nodeDef) && Survey.canUpdateCategory(nodeDef)(survey)

  return {
    categories,
    readOnly,
    nodeDef,
    canSelect,
  }
}

export default connect(mapStateToProps, {
  createCategory,
  deleteCategory,
  putNodeDefProp,
})(CategoriesView)
