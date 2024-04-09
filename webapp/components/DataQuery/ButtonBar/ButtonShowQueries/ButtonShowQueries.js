import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'

import { State } from '../store'
import DataQueriesPanel from './DataQueriesPanel'

const ButtonShowQueries = (props) => {
  const { disabled, query, onChangeQuery, state, Actions, selectedQuerySummaryUuid, setSelectedQuerySummaryUuid } =
    props

  return (
    <>
      <Button
        className={classNames('btn-s', 'btn-edit')}
        disabled={disabled}
        iconClassName="icon-list icon-16px"
        onClick={Actions.togglePanelQueries}
        label="dataView.queries"
      />

      {State.isPanelQueriesShown(state) && (
        <DataQueriesPanel
          query={query}
          onChangeQuery={onChangeQuery}
          onClose={Actions.togglePanelQueries}
          selectedQuerySummaryUuid={selectedQuerySummaryUuid}
          setSelectedQuerySummaryUuid={setSelectedQuerySummaryUuid}
        />
      )}
    </>
  )
}

ButtonShowQueries.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object,
  onChangeQuery: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonShowQueries
