import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath, useHistory, useLocation } from 'react-router'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import PanelRight from '@webapp/components/PanelRight'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import ItemsView from '../items/itemsView'
import CategoryView from '../category/categoryView'

import * as CategoryActions from '../category/actions'
import * as CategoryState from '../category/categoryState'

const CategoriesView = (props) => {
  const { canSelect, onSelect, selectedItemUuid, onClose } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const history = useHistory()

  const inCategoriesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.categories)))

  const survey = useSelector(SurveyState.getSurvey)
  const readOnly = !useAuthCanEditSurvey()
  const editedCategory = useSelector(CategoryState.getCategoryForEdit)
  const categories = R.pipe(
    Survey.getCategoriesArray,
    R.map((category) => ({
      ...category,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey)),
    }))
  )(survey)

  const canDeleteCategory = (category) =>
    category.usedByNodeDefs ? dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' })) : true

  const onAdd = async () => {
    const category = await dispatch(CategoryActions.createCategory())
    if (onSelect) {
      onSelect(category)
    }
    if (inCategoriesPath) {
      history.push(`${appModuleUri(designerModules.category)}${Category.getUuid(category)}`)
    }
  }

  const onDelete = (category) =>
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'categoryEdit.confirmDelete',
        params: { categoryName: Category.getName(category) || i18n.t('common.undefinedName') },
        onOk: () => dispatch(CategoryActions.deleteCategory(category)),
      })
    )

  return (
    <>
      <ItemsView
        itemLabelFunction={Category.getName}
        items={categories}
        itemLink={inCategoriesPath ? appModuleUri(designerModules.category) : null}
        selectedItemUuid={selectedItemUuid}
        onAdd={onAdd}
        onEdit={(category) =>
          !inCategoriesPath && dispatch(CategoryActions.setCategoryForEdit(Category.getUuid(category)))
        }
        canDelete={canDeleteCategory}
        onDelete={onDelete}
        canSelect={canSelect}
        onSelect={onSelect}
        onClose={onClose}
        readOnly={readOnly}
      />
      {editedCategory && (
        <PanelRight
          width="100vw"
          header={i18n.t('categoryEdit.header')}
          onClose={() => dispatch(CategoryActions.setCategoryForEdit(null))}
        >
          <CategoryView showClose={false} />
        </PanelRight>
      )}
    </>
  )
}

CategoriesView.propTypes = {
  canSelect: PropTypes.bool,
  onSelect: PropTypes.func,
  selectedItemUuid: PropTypes.string,
  onClose: PropTypes.func,
}

CategoriesView.defaultProps = {
  canSelect: false,
  onSelect: null,
  selectedItemUuid: null,
  onClose: null,
}

export default CategoriesView
