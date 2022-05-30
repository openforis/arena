import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'
import { useSurvey } from '@webapp/store/survey'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

const DataSelector = ({ setEntityDefUuid, entityDefUuid }) => {
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

      <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
    </div>
  )
}

DataSelector.propTypes = {
  setEntityDefUuid: PropTypes.func.isRequired,
  toggleLabelFunction: PropTypes.func.isRequired,
}

export default DataSelector
