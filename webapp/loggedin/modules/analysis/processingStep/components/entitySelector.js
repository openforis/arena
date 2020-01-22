import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'
import Dropdown from '@webapp/commonComponents/form/dropdown'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

const getEntities = (survey, entityStepPrev, lang) => {
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
      })
    }
  }

  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = props => {
  const { processingStep, entities, showLabel, readOnly, onChange, children } = props

  const entity = entities.find(R.propEq('key', ProcessingStep.getEntityUuid(processingStep)))

  const i18n = useI18n()

  return (
    <div className={`form-item${showLabel ? ' processing-step__entity-selector-form-item' : ''}`}>
      {showLabel && <div className="form-label processing-chain__steps-label">{i18n.t('nodeDefsTypes.entity')}</div>}

      <Dropdown
        className="processing-step__entity-selector"
        autocompleteDialogClassName="processing-step__entity-selector-dialog"
        items={entities}
        selection={entity}
        readOnly={readOnly}
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
  onChange: null,
}

const mapStateToProps = (state, { processingStepPrev }) => {
  const survey = SurveyState.getSurvey(state)
  const entityStepPrev = R.pipe(ProcessingStep.getEntityUuid, entityUuid =>
    Survey.getNodeDefByUuid(entityUuid)(survey),
  )(processingStepPrev)

  return {
    entities: getEntities(survey, entityStepPrev, AppState.getLang(state)),
  }
}

export default connect(mapStateToProps)(EntitySelector)
