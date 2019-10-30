import React, { useEffect, useState } from 'react'
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

const getEntities = (hierarchy, lang) => {
  const entities = []

  const traverse = (nodeDef, depth) => {
    const label = NodeDef.getLabel(nodeDef, lang)
    entities.push({
      key: NodeDef.getUuid(nodeDef),
      value: StringUtils.nbsp + R.repeat(StringUtils.nbsp + StringUtils.nbsp, depth).join('') + label
    })
  }
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = props => {
  const {
    hierarchy, lang, processingStep,
    onChange
  } = props

  const [entities, setEntities] = useState([])
  useEffect(() => {
    setEntities(getEntities(hierarchy, lang))
  }, [])
  const entity = entities.find(R.propEq('key', ProcessingStep.getEntityUuid(processingStep)))

  const i18n = useI18n()

  return (
    <div className="form-item">

      <div className="form-label processing-chain__steps-label">
        {i18n.t('nodeDefsTypes.entity')}
      </div>

      <Dropdown
        className="processing-step__entity-selector"
        autocompleteDialogClassName="processing-step__entity-selector-dialog"
        items={entities}
        selection={entity}
        onChange={
          item => onChange(R.prop('key', item))
        }
      />

    </div>
  )
}

const mapStateToProps = state => ({
  hierarchy: Survey.getHierarchy()(SurveyState.getSurvey(state)),
  lang: AppState.getLang(state),
})

export default connect(mapStateToProps)(EntitySelector)