import './buttonBar.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { ButtonDownload } from '@webapp/components/buttons'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

import { useIsAppSaving } from '@webapp/store/app'
import { DataExplorerActions, DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useAuthCanCleanseRecords } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { DataQueryExportModal } from '../DataQueryExportModal'
import { State, useButtonBar } from './store'
import ButtonFilter from './ButtonFilter'
import ButtonSort from './ButtonSort'
import ButtonManageQueries from './ButtonManageQueries'
import { ButtonGroupDisplayType } from './ButtonGroupDisplayType'

const ButtonBar = (props) => {
  const { dataEmpty, dataLoaded, dataLoading, nodeDefLabelType, onNodeDefLabelTypeChange } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const appSaving = useIsAppSaving()
  const canEdit = useAuthCanCleanseRecords()
  const query = DataExplorerSelectors.useQuery()
  const nodeDefsSelectorVisible = DataExplorerSelectors.useIsNodeDefsSelectorVisible()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const modeEdit = Query.isModeRawEdit(query)
  const hasSelection = Query.hasSelection(query)
  const { Actions, state } = useButtonBar()

  const queryChangeDisabled = modeEdit || !dataLoaded || dataLoading

  return (
    <div className="data-query-button-bar">
      <button
        type="button"
        title={i18n.t(nodeDefsSelectorVisible ? 'dataView.nodeDefsSelector.hide' : 'dataView.nodeDefsSelector.show')}
        className={classNames('btn', 'btn-s', { highlight: nodeDefsSelectorVisible })}
        onClick={() => dispatch(DataExplorerActions.setNodeDefsSelectorVisible(!nodeDefsSelectorVisible))}
      >
        <span className="icon icon-tab icon-14px" />
      </button>

      <FormItem className="mode-form-item" label={i18n.t('dataView.dataQuery.mode.label')}>
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

      <ButtonManageQueries onChangeQuery={onChangeQuery} state={state} Actions={Actions} />

      <ButtonGroupDisplayType />
    </div>
  )
}

ButtonBar.propTypes = {
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  onNodeDefLabelTypeChange: PropTypes.func.isRequired,
}

export default ButtonBar
