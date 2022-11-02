import './buttonBar.scss'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { useIsAppSaving } from '@webapp/store/app'
import { useAuthCanCleanseRecords } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { useButtonBar } from './store'
import ButtonDownload from './ButtonDownload'
import ButtonFilter from './ButtonFilter'
import ButtonSort from './ButtonSort'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

const ButtonBar = (props) => {
  const {
    dataEmpty,
    dataLoaded,
    dataLoading,
    nodeDefLabelType,
    nodeDefsSelectorVisible,
    query,
    onChangeQuery,
    onNodeDefLabelTypeChange,
    setNodeDefsSelectorVisible,
  } = props

  const i18n = useI18n()
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
          title={i18n.t(nodeDefsSelectorVisible ? 'dataView.nodeDefsSelector.hide' : 'dataView.nodeDefsSelector.show')}
          className={classNames('btn', 'btn-s', { highlight: nodeDefsSelectorVisible })}
          onClick={() => setNodeDefsSelectorVisible(!nodeDefsSelectorVisible)}
        >
          <span className="icon icon-tab icon-14px" />
        </button>

        <button
          type="button"
          title={i18n.t('dataView.aggregateMode')}
          className={classNames('btn', 'btn-s', 'btn-edit', { highlight: Query.isModeAggregate(query) })}
          onClick={() => onChangeQuery(Query.toggleModeAggregate(query))}
          aria-disabled={appSaving || modeEdit || !nodeDefsSelectorVisible}
        >
          <span className="icon icon-sigma icon-14px" />
        </button>
        {canEdit && hasSelection && (
          <button
            type="button"
            title={i18n.t('dataView.editMode')}
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

      <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={onNodeDefLabelTypeChange} />
    </div>
  )
}

ButtonBar.propTypes = {
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  onNodeDefLabelTypeChange: PropTypes.func.isRequired,
  setNodeDefsSelectorVisible: PropTypes.func.isRequired,
}

export default ButtonBar
