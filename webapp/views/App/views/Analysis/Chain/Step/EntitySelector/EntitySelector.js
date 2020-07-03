import './EntitySelector.scss'

import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import Dropdown from '@webapp/components/form/dropdown'
import * as Chain from '@common/analysis/processingChain'

import { State } from '../../store'

const getEntities = (survey, processingStepPrev, lang) => {
  const entityStepPrev = R.pipe(ProcessingStep.getEntityUuid, (entityUuid) =>
    Survey.getNodeDefByUuid(entityUuid)(survey)
  )(processingStepPrev)

  const entities = []

  const traverse = (nodeDef, depth) => {
    if (
      !entityStepPrev ||
      NodeDef.isRoot(nodeDef) ||
      NodeDef.isVirtual(nodeDef) ||
      Survey.isNodeDefAncestor(nodeDef, entityStepPrev)(survey)
    ) {
      const label = NodeDef.getLabel(nodeDef, lang)
      entities.push({
        key: NodeDef.getUuid(nodeDef),
        value: `${StringUtils.nbsp}${R.repeat(StringUtils.nbsp, depth * 2).join('')}${label}`,
        label,
      })
    }
  }

  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = (props) => {
  const { readOnly, validation, children, onChange, state, Actions } = props

  const { chain, step } = State.get(state)

  const i18n = useI18n()
  const survey = useSurvey()
  const stepPrev = Chain.getStepPrev(step)(chain)

  const entities = getEntities(survey, stepPrev, i18n.lang)
  const entity = entities.find(R.propEq('key', ProcessingStep.getEntityUuid(step)))

  return (
    <div className="form-item step-entity-selector">
      <div className="form-label chain-list__label">{i18n.t('nodeDefsTypes.entity')}</div>

      <Dropdown
        className="step-entity-selector__dropdown"
        autocompleteDialogClassName="step-entity-selector__dropdown-dialog"
        items={entities}
        selection={entity}
        readOnly={readOnly}
        validation={validation}
        onBeforeChange={(item) => Actions.canSelectNodeDef(Survey.getNodeDefByUuid(R.prop('key', item))(survey))}
        onChange={(item) => onChange(R.prop('key', item))}
      />

      {children}
    </div>
  )
}

EntitySelector.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
  validation: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default EntitySelector
