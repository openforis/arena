import React from 'react'
import { useHistory } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import * as Category from '@core/survey/category'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

const TableRow = (props) => {
  const { row: category, idx, offset, inCategoriesPath, canSelect, onSelect: onSelectProp, selectedItemUuid } = props

  const history = useHistory()
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const canEdit = useAuthCanEditSurvey()

  const categoryUuid = Category.getUuid(category)
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
          params: { categoryName: Category.getName(category) || i18n.t('common.undefinedName') },
          onOk: () => dispatch(CategoryActions.deleteCategory(category)),
        })
      )
    } else {
      dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' }))
    }
  }

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{Category.getName(category)}</div>
      <div>
        <ErrorBadge validation={Category.validation} />
      </div>
      <div>
        <WarningBadge show={unused} label={i18n.t('itemsTable.unused')} />
      </div>
      <div>
        {(canSelect || selected) && (
          <button type="button" className={`btn btn-s${selected ? ' active' : ''}`} onClick={onSelect}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {selected ? i18n.t(`common.selected`) : i18n.t(`common.select`)}
          </button>
        )}
      </div>
      <div>
        {canEdit && (
          <button type="button" className="btn btn-s" onClick={onEdit}>
            <span className="icon icon-pencil2 icon-12px icon-left" />
            {i18n.t('common.edit')}
          </button>
        )}
      </div>
      <div>
        {canEdit && (
          <button type="button" className="btn btn-s" onClick={onDelete}>
            <span className="icon icon-bin2 icon-12px icon-left" />
            {i18n.t('common.delete')}
          </button>
        )}
      </div>
    </>
  )
}

export default TableRow
