import './DataSelector.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

import classNames from 'classnames'

const DimensionGroup = ({ dimensionGroup }) => {
  const { label, options } = dimensionGroup
  const [visible, setVisible] = useState(false)

  return (
    <div className="charts_data-selector_group-dimension" key={label}>
      <p>
        <button
          type="button"
          className={classNames('btn-xs btn-toggle', { rotate: visible })}
          onClick={() => setVisible(!visible)}
        >
          <span className={classNames('icon icon-12px icon-play3')} />
        </button>
        <b>{label}</b>
      </p>
      {visible && (
        <div className="charts_data-selector_group-dimension">
          {options?.map(({ name, label: optionLabel, icon }) => (
            <div key={name} className="charts_data-selector_dimension">
              {optionLabel}
              {icon}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const DataSelector = ({ setEntityDefUuid, entityDefUuid, dimensions, nodeDefLabelType, toggleLabelFunction }) => {
  const i18n = useI18n()
  const survey = useSurvey()

  return (
    <div className="charts_data-selector__container">
      <p>{i18n.t('nodeDefsTypes.entity')}</p>
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        nodeDefUuidEntity={entityDefUuid}
        onChange={setEntityDefUuid}
        showSingleEntities={false}
        disabled={false}
        useNameAsLabel={false}
        allowEmptySelection={false}
      />

      <br />
      {dimensions.length > 0 && (
        <>
          <p>{i18n.t('common.dimension_plural')}</p>
          <br />
          <div className="charts_data-selector_group-dimension_container">
            {dimensions
              .filter(({ options }) => options.length > 0)
              .map((dimensionGroup) => (
                <DimensionGroup key={dimensionGroup.label} dimensionGroup={dimensionGroup} />
              ))}
          </div>
        </>
      )}

      {entityDefUuid && <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={toggleLabelFunction} />}
    </div>
  )
}

DimensionGroup.propTypes = {
  dimensionGroup: PropTypes.shape({
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.node,
      })
    ).isRequired,
  }).isRequired,
}

DataSelector.propTypes = {
  entityDefUuid: PropTypes.string,
  setEntityDefUuid: PropTypes.func.isRequired,
  toggleLabelFunction: PropTypes.func.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  dimensions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          icon: PropTypes.node,
        })
      ),
    })
  ),
}

export default DataSelector
