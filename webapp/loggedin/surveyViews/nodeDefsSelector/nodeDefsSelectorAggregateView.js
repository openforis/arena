import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { useSurvey, useSurveyLang } from '@webapp/commonComponents/hooks'

import ExpansionPanel from '@webapp/commonComponents/expansionPanel'

import AttributesSelector from './components/attributesSelector'
import EntitySelector from './components/entitySelector'

const NodeDefsSelectorAggregateView = (props) => {
  const { nodeDefUuidEntity, onChangeEntity } = props

  const survey = useSurvey()
  const lang = useSurveyLang()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)

  return (
    <div className="node-defs-selector">
      <EntitySelector
        hierarchy={hierarchy}
        lang={lang}
        nodeDefUuidEntity={nodeDefUuidEntity}
        onChange={onChangeEntity}
      />

      {nodeDefUuidEntity && (
        <>
          <ExpansionPanel buttonLabel="common.measure" buttonLabelParams={{ count: 2 }}>
            <AttributesSelector
              onToggleAttribute={() => {}}
              lang={lang}
              filterTypes={[NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer]}
              nodeDefUuidEntity={nodeDefUuidEntity}
              nodeDefUuidsAttributes={[]}
              showAncestorsLabel={false}
              showMultipleAttributes={false}
            />
          </ExpansionPanel>

          <ExpansionPanel buttonLabel="common.dimension" buttonLabelParams={{ count: 2 }}>
            <AttributesSelector
              onToggleAttribute={() => {}}
              lang={lang}
              filterTypes={[NodeDef.nodeDefType.code]}
              nodeDefUuidEntity={nodeDefUuidEntity}
              nodeDefUuidsAttributes={[]}
              showAncestorsLabel={false}
              showMultipleAttributes={false}
            />
          </ExpansionPanel>
        </>
      )}
    </div>
  )
}

NodeDefsSelectorAggregateView.propTypes = {
  nodeDefUuidEntity: PropTypes.string,
  onChangeEntity: PropTypes.func.isRequired,
}

NodeDefsSelectorAggregateView.defaultProps = {
  nodeDefUuidEntity: null,
}

export default NodeDefsSelectorAggregateView
