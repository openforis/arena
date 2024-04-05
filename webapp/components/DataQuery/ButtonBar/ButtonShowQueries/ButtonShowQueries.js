import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'

import { State } from '../store'
import DataQueriesPanel from './DataQueriesPanel'

const ButtonShowQueries = (props) => {
  const { disabled, query, onChangeQuery, state, Actions } = props

  return (
    <>
      <Button
        className={classNames('btn-s', 'btn-edit')}
        disabled={disabled}
        iconClassName="icon-list icon-16px"
        onClick={Actions.togglePanelQueries}
        title="dataView.queries"
      />

      {State.isPanelQueriesShown(state) && (
        <DataQueriesPanel query={query} onChangeQuery={onChangeQuery} onClose={Actions.togglePanelQueries} />
      )}
    </>
  )
}

ButtonShowQueries.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonShowQueries
