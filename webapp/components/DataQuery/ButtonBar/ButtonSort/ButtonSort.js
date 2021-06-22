import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query, Sort, SortCriteria } from '@common/model/query'

import { useI18n } from '@webapp/store/system'

import Tooltip from '@webapp/components/tooltip'

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
      <Tooltip messages={tooltipMessages}>
        <button
          type="button"
          title={i18n.t('dataView.sort')}
          className={classNames('btn', 'btn-s', 'btn-edit', { highlight: !Sort.isEmpty(sort) })}
          onClick={Actions.togglePanelSort}
          aria-disabled={disabled}
        >
          <span className="icon icon-sort-amount-asc icon-14px" />
        </button>
      </Tooltip>

      {State.showPanelSort(state) && (
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
