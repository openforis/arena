import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'
import Dropdown from '@webapp/commonComponents/form/dropdown'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'

import { checkCanSelectNodeDef } from '../../actions'

const getEntities = (survey, processingStepPrev, lang) => {
  const entityStepPrev = R.pipe(ProcessingStep.getEntityUuid, entityUuid =>
    Survey.getNodeDefByUuid(entityUuid)(survey),
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

const EntitySelector = props => {
  const { processingStep, processingStepPrev, showLabel, readOnly, validation, children, onChange } = props

  const survey = useSelector(SurveyState.getSurvey)

  const i18n = useI18n()
  const dispatch = useDispatch()

  const entities = getEntities(survey, processingStepPrev, i18n.lang)

  const entity = entities.find(R.propEq('key', ProcessingStep.getEntityUuid(processingStep)))

  return (
    <div className={`form-item${showLabel ? ' processing-step__entity-selector-form-item' : ''}`}>
      {showLabel && <div className="form-label processing-chain__steps-label">{i18n.t('nodeDefsTypes.entity')}</div>}

      <Dropdown
        className="processing-step__entity-selector"
        autocompleteDialogClassName="processing-step__entity-selector-dialog"
        items={entities}
        selection={entity}
        readOnly={readOnly}
        validation={validation}
        onBeforeChange={item => dispatch(checkCanSelectNodeDef(Survey.getNodeDefByUuid(R.prop('key', item))(survey)))}
        onChange={item => onChange(R.prop('key', item))}
      />

      {children}
    </div>
  )
}

EntitySelector.defaultProps = {
  processingStep: null,
  processingStepPrev: null,
  showLabel: true,
  readOnly: false,
  validation: null,
  onChange: null,
}

export default EntitySelector
