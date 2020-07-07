import { useHistory } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

export const useTableRow = (props) => {
  const {
    row: category,
    idx,
    offset,
    inCategoriesPath,
    canEdit,
    canSelect,
    onSelect: onSelectProp,
    selectedItemUuid,
  } = props

  const history = useHistory()
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()

  const rowPosition = idx + offset + 1
  const categoryUuid = Category.getUuid(category)
  const categoryName = Category.getName(category)
  const unused = A.isEmpty(Survey.getNodeDefsByCategoryUuid(categoryUuid)(survey))
  const selected = categoryUuid === selectedItemUuid

  const onSelect = () => onSelectProp(category)

  const onEdit = () => {
    if (inCategoriesPath) {
      history.push(`${appModuleUri(designerModules.category)}${categoryUuid}`)
    } else {
      dispatch(CategoryActions.setCategoryForEdit(categoryUuid))
    }
  }

  const onDelete = () => {
    if (unused) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'categoryEdit.confirmDelete',
          params: { categoryName: categoryName || i18n.t('common.undefinedName') },
          onOk: () => dispatch(CategoryActions.deleteCategory(category)),
        })
      )
    } else {
      dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' }))
    }
  }

  return {
    canEdit,
    canSelect,
    category,
    onDelete,
    onEdit,
    onSelect,
    rowPosition,
    selected,
    unused,
  }
}
