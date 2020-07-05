import './buttonBar.scss'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { useIsAppSaving } from '@webapp/store/app'
import { useAuthCanCleanseRecords } from '@webapp/store/user'

import { useButtonBar } from './store'
import ButtonDownload from './ButtonDownload'
import ButtonFilter from './ButtonFilter'
import ButtonSort from './ButtonSort'

const ButtonBar = (props) => {
  const {
    dataEmpty,
    dataLoaded,
    dataLoading,
    nodeDefsSelectorVisible,
    query,
    onChangeQuery,
    setNodeDefsSelectorVisible,
  } = props

  const appSaving = useIsAppSaving()
  const canEdit = useAuthCanCleanseRecords()
  const modeEdit = Query.isModeRawEdit(query)
  const modeAggregate = Query.isModeAggregate(query)
  const hasSelection = Query.hasSelection(query)

  const { Actions, state } = useButtonBar()

  return (
    <div className="data-query-button-bar">
      <div>
        <button
          type="button"
          className={classNames('btn', 'btn-s', { highlight: nodeDefsSelectorVisible })}
          onClick={() => setNodeDefsSelectorVisible(!nodeDefsSelectorVisible)}
        >
          <span className="icon icon-tab icon-14px" />
        </button>
        <button
          type="button"
          className={classNames('btn', 'btn-s', 'btn-edit', { highlight: Query.isModeAggregate(query) })}
          onClick={() => onChangeQuery(Query.toggleModeAggregate(query))}
          aria-disabled={appSaving || modeEdit || !nodeDefsSelectorVisible}
        >
          <span className="icon icon-sigma icon-14px" />
        </button>
        {canEdit && hasSelection && (
          <button
            type="button"
            className={classNames('btn', 'btn-s', 'btn-edit', { highlight: modeEdit })}
            onClick={() => onChangeQuery(Query.toggleModeEdit(query))}
            aria-disabled={appSaving || modeAggregate || dataEmpty || !dataLoaded}
          >
            <span className="icon icon-pencil2 icon-14px" />
          </button>
        )}
      </div>

      {hasSelection && (
        <div>
          <ButtonFilter
            query={query}
            disabled={modeEdit || !dataLoaded || dataLoading}
            onChangeQuery={onChangeQuery}
            state={state}
            Actions={Actions}
          />
          <ButtonSort
            query={query}
            disabled={modeEdit || !dataLoaded || dataLoading}
            onChangeQuery={onChangeQuery}
            state={state}
            Actions={Actions}
          />
          <ButtonDownload query={query} disabled={modeEdit || !dataLoaded || dataLoading} />
        </div>
      )}
    </div>
  )
}

ButtonBar.propTypes = {
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  setNodeDefsSelectorVisible: PropTypes.func.isRequired,
}

export default ButtonBar
