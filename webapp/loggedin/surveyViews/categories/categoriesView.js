import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import { appModuleUri, designerModules, analysisModules } from '@webapp/app/appModules'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import * as NodeDefState from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/state'
import * as NodeDefStorage from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/storage'
import { createCategory, deleteCategory } from '../category/actions'
import ItemsView from '../items/itemsView'

const CategoriesView = (props) => {
  const { analysis } = props

  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()

  const survey = useSurvey()
  const readOnly = !useAuthCanEditSurvey()
  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map((category) => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)),
    }))
  )(survey)

  // A nodeDef code is begin edited.
  const nodeDefState = NodeDefStorage.getNodeDefState()
  const nodeDef = !readOnly && nodeDefState && NodeDefState.getNodeDef(nodeDefState)
  const canSelect = nodeDef && NodeDef.isCode(nodeDef) && Survey.canUpdateCategory(nodeDef)(survey)

  const [nodeDefCategoryUuid, setNodeDefCategoryUuid] = useState(nodeDef && NodeDef.getCategoryUuid(nodeDef))

  const onClose = () => {
    if (nodeDef) {
      const nodeDefStateUpdated = NodeDefState.assocNodeDefProp(
        NodeDef.propKeys.categoryUuid,
        nodeDefCategoryUuid
      )(nodeDefState)
      NodeDefStorage.setNodeDefState(nodeDefStateUpdated)
      history.goBack()
    }
  }

  const canDeleteCategory = (category) =>
    category.usedByNodeDefs ? dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' })) : true

  const onDelete = (category) =>
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'categoryEdit.confirmDelete',
        params: { categoryName: Category.getName(category) || i18n.t('common.undefinedName') },
        onOk: () => dispatch(deleteCategory(category)),
      })
    )

  return (
    <ItemsView
      itemLabelFunction={(category) => Category.getName(category)}
      itemLink={appModuleUri(analysis ? analysisModules.category : designerModules.category)}
      items={categories}
      selectedItemUuid={nodeDefCategoryUuid}
      onAdd={() => dispatch(createCategory(history, analysis, nodeDefState))}
      canDelete={canDeleteCategory}
      onDelete={onDelete}
      canSelect={canSelect}
      onSelect={(category) => setNodeDefCategoryUuid(Category.getUuid(category))}
      onClose={onClose}
      readOnly={readOnly}
    />
  )
}

CategoriesView.propTypes = {
  analysis: PropTypes.bool,
}

CategoriesView.defaultProps = {
  analysis: false,
}

export default CategoriesView
