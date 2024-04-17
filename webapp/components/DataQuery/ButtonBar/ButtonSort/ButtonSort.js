import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query, Sort, SortCriteria } from '@common/model/query'

import { useI18n } from '@webapp/store/system'

import { Button } from '@webapp/components/buttons'

import { State } from '../store'
import SortEditor from './SortEditor'

const ButtonSort = (props) => {
  const { disabled, query, onChangeQuery, state, Actions } = props
  const sort = Query.getSort(query)

  const i18n = useI18n()

  const tooltipMessages = sort.map(
    (sortCriteria) =>
      `${SortCriteria.getLabel(sortCriteria)} (${i18n.t(`common.${SortCriteria.getOrder(sortCriteria)}ending`)})`
  )

  return (
    <>
      <Button
        className={classNames('btn-edit', { highlight: !Sort.isEmpty(sort) })}
        disabled={disabled}
        iconClassName="icon-sort-amount-asc icon-16px"
        label="dataView.sort"
        onClick={Actions.togglePanelSort}
        title={tooltipMessages.length > 0 ? tooltipMessages.join('\n') : undefined}
      />

      {State.isPanelSortShow(state) && (
        <SortEditor
          query={query}
          onChange={(sortUpdated) => {
            onChangeQuery(Query.assocSort(sortUpdated))
            Actions.closePanels()
          }}
          onClose={Actions.closePanels}
        />
      )}
    </>
  )
}

ButtonSort.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonSort
