import './buttonBar.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { useIsAppSaving } from '@webapp/store/app'
import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useAuthCanCleanseRecords } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { useButtonBar } from './store'
import ButtonDownload from './ButtonDownload'
import ButtonFilter from './ButtonFilter'
import ButtonSort from './ButtonSort'
import ButtonShowQueries from './ButtonShowQueries'

const ButtonBar = (props) => {
  const {
    dataEmpty,
    dataLoaded,
    dataLoading,
    nodeDefLabelType,
    nodeDefsSelectorVisible,
    onNodeDefLabelTypeChange,
    setNodeDefsSelectorVisible,
  } = props

  const i18n = useI18n()
  const appSaving = useIsAppSaving()
  const canEdit = useAuthCanCleanseRecords()
  const query = DataExplorerSelectors.useQuery()
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
        onClick={() => setNodeDefsSelectorVisible(!nodeDefsSelectorVisible)}
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
          <ButtonDownload disabled={queryChangeDisabled} />
        </div>
      )}

      <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={onNodeDefLabelTypeChange} />

      <ButtonShowQueries onChangeQuery={onChangeQuery} state={state} Actions={Actions} />
    </div>
  )
}

ButtonBar.propTypes = {
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  onNodeDefLabelTypeChange: PropTypes.func.isRequired,
  setNodeDefsSelectorVisible: PropTypes.func.isRequired,
}

export default ButtonBar
