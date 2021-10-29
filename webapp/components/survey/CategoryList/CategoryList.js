import './CategoryList.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import Table from '@webapp/components/Table'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import TableHeaderLeft from './TableHeaderLeft'

import { useActions, useLocalState } from './store'
import { ButtonDelete, ButtonIconEdit } from '@webapp/components/buttons'

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
      renderItem: ({ item: category }) =>
        i18n.t(`categoryList.types.${Category.getLevelsCount(category) > 1 ? 'hierarchical' : 'flat'}`),
      width: '100px',
    },
  ]

  if (canEdit) {
    // ERROR / WARNING
    columns.push(
      {
        key: 'error',
        renderItem: ({ item: category }) => <ErrorBadge validation={Category.getValidation(category)} />,
        width: '85px',
      },
      {
        key: 'warning',
        renderItem: ({ item: category }) => {
          const unused = A.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))
          return <WarningBadge show={unused} label={i18n.t('itemsTable.unused')} />
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
          <button
            type="button"
            className={`btn btn-s${selected ? ' active' : ''}`}
            onClick={() => Actions.select({ category })}
          >
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {i18n.t(selected ? 'common.selected' : 'common.select')}
          </button>
        )
      },
      width: '80px',
    })
  }

  if (canEdit) {
    columns.push(
      // EDIT
      {
        key: 'edit',
        renderItem: ({ item: category }) => (
          <ButtonIconEdit size="small" onClick={() => Actions.edit({ category })} label="common.edit" />
        ),
        width: '75px',
      },
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
      restParams={{ draft: canEdit, validate: canEdit }}
      headerLeftComponent={TableHeaderLeft}
      headerProps={{ state }}
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
