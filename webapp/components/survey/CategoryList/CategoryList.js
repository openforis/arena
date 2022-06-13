import './CategoryList.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as Validation from '@core/validation/validation'

import Table from '@webapp/components/Table'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import TableHeaderLeft from './TableHeaderLeft'

import { useActions, useLocalState } from './store'
import { Button, ButtonDelete, ButtonIconEdit } from '@webapp/components/buttons'

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
      renderItem: ({ item: category }) => {
        const type = Category.isReportingData(category)
          ? 'reportingData'
          : Category.getLevelsCount(category) > 1
          ? 'hierarchical'
          : 'flat'
        return i18n.t(`categoryList.types.${type}`)
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
          const unused =
            !Category.isReportingData(category) &&
            A.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))

          if (unused) {
            return <WarningBadge show={unused} label={i18n.t('itemsTable.unused')} />
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
