import React from 'react'
import { connect, useDispatch } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/components/hooks'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import { SurveyState, NodeDefsActions } from '@webapp/store/survey'
import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'
import { appModuleUri, designerModules, analysisModules } from '@webapp/app/appModules'

import { showNotification } from '@webapp/app/appNotification/actions'
import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { createCategory, deleteCategory } from '../category/actions'
import ItemsView from '../items/itemsView'

const CategoriesView = (props) => {
  const { categories, nodeDef, createCategory, deleteCategory, canSelect, readOnly, analysis, setNodeDefProp } = props
  const selectedItemUuid = nodeDef && NodeDef.getCategoryUuid(nodeDef)

  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()

  const onClose = nodeDef ? history.goBack : null

  const canDeleteCategory = (category) =>
    category.usedByNodeDefs ? dispatch(showNotification('categoryEdit.cantBeDeleted')) : true

  const onDelete = (category) =>
    dispatch(
      showDialogConfirm(
        'categoryEdit.confirmDelete',
        { categoryName: Category.getName(category) || i18n.t('common.undefinedName') },
        () => deleteCategory(category)
      )
    )

  return (
    <ItemsView
      itemLabelFunction={(category) => Category.getName(category)}
      itemLink={appModuleUri(analysis ? analysisModules.category : designerModules.category)}
      items={categories}
      selectedItemUuid={selectedItemUuid}
      onAdd={createCategory}
      canDelete={canDeleteCategory}
      onDelete={onDelete}
      canSelect={canSelect}
      onSelect={(category) => setNodeDefProp(NodeDef.propKeys.categoryUuid, Category.getUuid(category))}
      onClose={onClose}
      readOnly={readOnly}
    />
  )
}

const mapStateToProps = (state) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const readOnly = !Authorizer.canEditSurvey(user, surveyInfo)
  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map((category) => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)),
    }))
  )(survey)
  // A nodeDef code is begin edited.
  const nodeDef = !readOnly && NodeDefState.getNodeDef(state)
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
  setNodeDefProp: NodeDefsActions.setNodeDefProp,
})(CategoriesView)
