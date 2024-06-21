import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query, Sort, SortCriteria } from '@common/model/query'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { Button } from '@webapp/components/buttons'

import { State } from '../store'
import SortEditor from './SortEditor'

const ButtonSort = (props) => {
  const { disabled, state, Actions } = props

  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

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
        variant="outlined"
      />

      {State.isPanelSortShow(state) && (
        <SortEditor
          query={query}
          onChange={(sortUpdated) => {
            onChangeQuery(Query.assocSort(sortUpdated)(query))
            Actions.closePanels()
          }}
          onClose={Actions.closePanels}
        />
      )}
    </>
  )
}

ButtonSort.propTypes = {
  Actions: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  state: PropTypes.object.isRequired,
}

export default ButtonSort
