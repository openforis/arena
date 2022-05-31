import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

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
        useNameAsLabel={true}
      />

      <br />

      <p>{i18n.t('common.dimension_plural')}</p>

      {dimensions?.map((dimensionGroup) => (
        <div key={dimensionGroup.label}>
          <p>{dimensionGroup.label}</p>
          {dimensionGroup?.options?.map((dimension) => (
            <p key={dimension.name}>{dimension.label}</p>
          ))}
        </div>
      ))}
      <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
    </div>
  )
}

DataSelector.propTypes = {
  entityDefUuid: PropTypes.string.isRequired,
  setEntityDefUuid: PropTypes.func.isRequired,
  toggleLabelFunction: PropTypes.func.isRequired,
  entityDefUuid: PropTypes.string.isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  dimensions: PropTypes.any,
}

export default DataSelector
