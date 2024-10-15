import './buttonBar.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { Button, ButtonDownload } from '@webapp/components/buttons'
import { ButtonGroup, Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

import { useIsAppSaving } from '@webapp/store/app'
import {
  DataExplorerActions,
  DataExplorerHooks,
  DataExplorerSelectors,
  DataExplorerState,
} from '@webapp/store/dataExplorer'
import { useAuthCanCleanseRecords } from '@webapp/store/user'

import { DataQueryExportModal } from '../DataQueryExportModal'
import { State, useButtonBar } from './store'
import ButtonFilter from './ButtonFilter'
import ButtonSort from './ButtonSort'
import ButtonManageQueries from './ButtonManageQueries'
import { ButtonGroupDisplayType } from './ButtonGroupDisplayType'

const ButtonBar = (props) => {
  const {
    dataCount,
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
  const displayType = DataExplorerSelectors.useDisplayType()
  const query = DataExplorerSelectors.useQuery()
  const nodeDefsSelectorVisible = DataExplorerSelectors.useIsNodeDefsSelectorVisible()
  const codesVisible = DataExplorerSelectors.useCodesVisible()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const modeEdit = Query.isModeRawEdit(query)
  const hasSelection = Query.hasSelection(query)
  const { Actions, state } = useButtonBar()

  const queryChangeDisabled = modeEdit || !dataLoaded || dataLoading

  return (
    <div className="data-query-button-bar">
      <Button
        className={classNames('btn-toggle-node-defs-selector', 'btn-s', { highlight: nodeDefsSelectorVisible })}
        iconClassName="icon-tab icon-14px"
        onClick={() => dispatch(DataExplorerActions.setNodeDefsSelectorVisible(!nodeDefsSelectorVisible))}
        title={nodeDefsSelectorVisible ? 'dataView.nodeDefsSelector.hide' : 'dataView.nodeDefsSelector.show'}
        variant="outlined"
      />

      <FormItem className="mode-form-item" label="dataView.dataQuery.mode.label">
        <ButtonGroup
          disabled={appSaving || !nodeDefsSelectorVisible}
          groupName="queryMode"
          selectedItemKey={Query.getMode(query)}
          onChange={(mode) => onChangeQuery(Query.assocMode(mode)(query))}
          items={[
            {
              key: Query.modes.raw,
              iconClassName: 'icon-file-text2',
              label: 'dataView.dataQuery.mode.raw',
            },
            {
              key: Query.modes.aggregate,
              iconClassName: 'icon-sigma',
              label: 'dataView.dataQuery.mode.aggregate',
            },
            ...(canEdit && hasSelection
              ? [
                  {
                    key: Query.modes.rawEdit,
                    iconClassName: 'icon-pencil2',
                    label: 'dataView.dataQuery.mode.rawEdit',
                    disabled: dataEmpty,
                  },
                ]
              : []),
          ]}
        />
      </FormItem>

      {hasSelection && (
        <div>
          <ButtonFilter disabled={queryChangeDisabled} state={state} Actions={Actions} />
          <ButtonSort disabled={queryChangeDisabled} state={state} Actions={Actions} />
          <ButtonDownload disabled={queryChangeDisabled} label="common.csvExport" onClick={Actions.togglePanelExport} />
          {State.isPanelExportShown(state) && <DataQueryExportModal onClose={Actions.togglePanelExport} />}
        </div>
      )}

      <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={onNodeDefLabelTypeChange} />

      {displayType === DataExplorerState.displayTypes.table && (
        <Checkbox
          checked={codesVisible}
          onChange={(val) => dispatch(DataExplorerActions.setCodesVisible(val))}
          label="dataView.dataQuery.showCodes"
        />
      )}

      <ButtonManageQueries onChangeQuery={onChangeQuery} state={state} Actions={Actions} />

      <ButtonGroupDisplayType dataCount={dataCount} setQueryLimit={setQueryLimit} setQueryOffset={setQueryOffset} />
    </div>
  )
}

ButtonBar.propTypes = {
  dataCount: PropTypes.number,
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  onNodeDefLabelTypeChange: PropTypes.func.isRequired,
  setQueryLimit: PropTypes.func.isRequired,
  setQueryOffset: PropTypes.func.isRequired,
}

export default ButtonBar
