import './buttonBar.scss'

import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { Spinner, Switch } from '@webapp/components'
import { Button, ButtonDownload } from '@webapp/components/buttons'

import { useIsAppSaving } from '@webapp/store/app'
import { DataExplorerActions, DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useAuthCanCleanseRecords } from '@webapp/store/user'

import { DataQueryExportModal } from '../DataQueryExportModal'
import { State, useButtonBar } from './store'
import ButtonManageQueries from './ButtonManageQueries'
import { ButtonAiGenerateQuery } from './ButtonAiGenerateQuery'
import ButtonFilter from './ButtonFilter'
import ButtonSort from './ButtonSort'
import { ButtonGroupDisplayType } from './ButtonGroupDisplayType'
import { ButtonViewOptions } from './ButtonViewOptions'

const ButtonBar = (props) => {
  const {
    dataEmpty,
    dataLoaded,
    dataLoading,
    nodeDefLabelType,
    onNodeDefLabelTypeChange,
    setQueryLimit,
    setQueryOffset,
  } = props

  const dispatch = useDispatch()
  const appSaving = useIsAppSaving()
  const canEdit = useAuthCanCleanseRecords()
  const query = DataExplorerSelectors.useQuery()
  const nodeDefsSelectorVisible = DataExplorerSelectors.useIsNodeDefsSelectorVisible()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const { Actions, state } = useButtonBar()

  const onEditCheckboxChange = useCallback(
    (value) => {
      const modeNext = value ? Query.modes.rawEdit : Query.modes.raw
      onChangeQuery(Query.assocMode(modeNext)(query))
    },
    [onChangeQuery, query]
  )
  const modeEdit = Query.isModeRawEdit(query)
  const hasSelection = Query.hasSelection(query)
  const queryChangeDisabled = modeEdit || !dataLoaded || dataLoading

  return (
    <div className="data-query-button-bar">
      <div className="data-query-button-bar__internal-container">
        <Button
          className={classNames('btn-toggle-node-defs-selector', 'btn-s', { highlight: nodeDefsSelectorVisible })}
          iconClassName="icon-tab icon-14px"
          onClick={() => dispatch(DataExplorerActions.setNodeDefsSelectorVisible(!nodeDefsSelectorVisible))}
          title={nodeDefsSelectorVisible ? 'dataView:nodeDefsSelector.hide' : 'dataView:nodeDefsSelector.show'}
          variant="outlined"
        />
        <div className="data-query-loading-spinner">{dataLoading && <Spinner size={18} />}</div>
        {canEdit && hasSelection && !Query.isModeAggregate(query) && (
          <Switch checked={modeEdit} disabled={dataEmpty} label="common.edit" onChange={onEditCheckboxChange} />
        )}
      </div>

      <div className="data-query-button-bar__internal-container">
        <ButtonAiGenerateQuery disabled={appSaving || modeEdit} state={state} Actions={Actions} />
        <ButtonManageQueries onChangeQuery={onChangeQuery} state={state} Actions={Actions} />
        <ButtonViewOptions nodeDefLabelType={nodeDefLabelType} onNodeDefLabelTypeChange={onNodeDefLabelTypeChange} />
        {hasSelection && (
          <>
            <ButtonFilter disabled={queryChangeDisabled} state={state} Actions={Actions} />
            <ButtonSort disabled={queryChangeDisabled} state={state} Actions={Actions} />
            <ButtonDownload disabled={queryChangeDisabled} label="common.export" onClick={Actions.togglePanelExport} />
          </>
        )}
        {State.isPanelExportShown(state) && <DataQueryExportModal onClose={Actions.togglePanelExport} />}
        <ButtonGroupDisplayType setQueryLimit={setQueryLimit} setQueryOffset={setQueryOffset} />
      </div>
    </div>
  )
}

ButtonBar.propTypes = {
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  onNodeDefLabelTypeChange: PropTypes.func.isRequired,
  setQueryLimit: PropTypes.func.isRequired,
  setQueryOffset: PropTypes.func.isRequired,
}

export default ButtonBar
