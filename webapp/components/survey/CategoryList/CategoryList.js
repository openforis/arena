import './CategoryList.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Validation from '@core/validation/validation'

import Table from '@webapp/components/Table'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { Button, ButtonDelete, ButtonIconEditOrView } from '@webapp/components'

import TableHeaderLeft from './TableHeaderLeft'

import { State, useActions, useLocalState } from './store'

const getType = ({ category }) => {
  if (Category.isReportingData(category)) return 'reportingData'
  if (Category.isHierarchical(category)) return 'hierarchical'
  return 'flat'
}
const CategoryList = (props) => {
  const { canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid } = props

  const i18n = useI18n()

  const { state, setState } = useLocalState({
    canSelect,
    onCategoryCreated,
    onCategoryOpen,
    onSelect,
    selectedItemUuid,
  })

  const Actions = useActions({ setState })

  const canEdit = useAuthCanEditSurvey()
  const survey = useSurvey()
  const requestedAt = State.getCategoriesRequestedAt(state)

  const columns = [
    // POSITION
    { key: 'position', header: '#', renderItem: ({ itemPosition }) => itemPosition, width: '50px' },
    // NAME
    {
      key: 'name',
      header: 'common.name',
      renderItem: ({ item: category }) => Category.getName(category),
      width: '1fr',
    },
    // TYPE
    {
      key: 'type',
      header: 'common.type',
      renderItem: ({ item: category }) => {
        const type = getType({ category })
        return i18n.t(`categoryList.types.${type}`)
      },
      width: '10rem',
    },
    // Extra props
    {
      key: 'extraProps',
      header: 'extraProp.label_plural',
      renderItem: ({ item: category }) =>
        Category.getItemExtraDefsArray(category).length > 0 ? <span className="icon icon-checkmark" /> : null,
      width: '8rem',
    },
    // Items count
    {
      key: 'itemsCount',
      header: 'categoryList.itemsCount',
      renderItem: ({ item: category }) => {
        const levels = Category.getLevelsArray(category)
        return levels.map((level) => CategoryLevel.getItemsCount(level)).join(' / ')
      },
      width: '10rem',
    },
  ]

  if (canEdit) {
    // ERROR / WARNING
    columns.push(
      {
        key: 'error',
        renderItem: ({ item: category }) => {
          const validation = Category.getValidation(category)
          if (Validation.isValid(validation) || !Validation.isError(validation)) return null
          return <ErrorBadge validation={validation} />
        },
        width: '85px',
      },
      {
        key: 'warning',
        renderItem: ({ item: category }) => {
          if (Survey.isCategoryUnused(category)(survey)) {
            return <WarningBadge label={i18n.t('itemsTable.unused')} />
          }
          const validation = Category.getValidation(category)
          if (Validation.isValid(validation) || Validation.isError(validation)) return null

          return <ErrorBadge showIcon showLabel={false} validation={validation} />
        },
        width: '85px',
      }
    )
  }
  if (canSelect) {
    // SELECT
    columns.push({
      key: 'select',
      renderItem: ({ item: category }) => {
        const selected = selectedItemUuid && selectedItemUuid === Category.getUuid(category)
        return (
          <Button
            className={`btn btn-s${selected ? ' active' : ''}`}
            onClick={() => Actions.select({ category })}
            iconClassName={`icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`}
            label={selected ? 'common.selected' : 'common.select'}
          />
        )
      },
      width: '80px',
    })
  }

  // DETAILS
  columns.push({
    key: 'details',
    renderItem: ({ item: category }) => (
      <ButtonIconEditOrView onClick={() => Actions.edit({ category })} canEdit={canEdit} size="small" />
    ),
    width: '75px',
  })

  if (canEdit) {
    columns.push(
      // DELETE
      {
        key: 'delete',
        renderItem: ({ initData, item: category }) => (
          <ButtonDelete size="small" onClick={() => Actions.delete({ category, initData })} showLabel={false} />
        ),
        width: '30px',
      }
    )
  }

  return (
    <Table
      className="categories"
      module="categories"
      restParams={{ draft: canEdit, requestedAt, validate: canEdit }}
      headerLeftComponent={TableHeaderLeft}
      headerProps={{ state, setState }}
      columns={columns}
    />
  )
}

CategoryList.propTypes = {
  canSelect: PropTypes.bool,
  onCategoryCreated: PropTypes.func,
  onCategoryOpen: PropTypes.func,
  onSelect: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

CategoryList.defaultProps = {
  canSelect: false,
  onCategoryCreated: null,
  onCategoryOpen: null,
  onSelect: null,
  selectedItemUuid: null,
}

export default CategoryList
