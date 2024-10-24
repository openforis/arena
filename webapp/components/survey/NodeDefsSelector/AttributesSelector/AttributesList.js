import './AttributesList.scss'

import React, { useMemo } from 'react'
import * as PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import AttributeSelector from './AttributeSelector'

export const AttributesList = (props) => {
  const {
    canSelectAttributes,
    nodeDefContext,
    nodeDefLabelType,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    showAncestorsLabel,
    attributeDefs,
  } = props

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const childDefsByParentUuid = useMemo(
    () => ObjectUtils.groupByProp(NodeDef.keys.parentUuid)(attributeDefs),
    [attributeDefs]
  )

  return Object.entries(childDefsByParentUuid).map(([parentDefUuid, childDefs]) => {
    const childDefParentDef = Survey.getNodeDefByUuid(parentDefUuid)(survey)

    return childDefs.map((childDef, index) => {
      const parentHeadingVisible = index === 0 && childDefParentDef !== nodeDefContext
      return (
        <div key={NodeDef.getUuid(childDef)} className="attribute-selector-wrapper">
          {parentHeadingVisible && (
            <span className="attribute-selector-parent-entity-heading">
              {NodeDef.getLabelWithType({ nodeDef: childDefParentDef, lang, type: nodeDefLabelType })}
            </span>
          )}
          <AttributeSelector
            canSelectAttributes={canSelectAttributes}
            nodeDef={childDef}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onToggleAttribute={onToggleAttribute}
            showNodeDefPath={!showAncestorsLabel}
            nodeDefLabelType={nodeDefLabelType}
          />
        </div>
      )
    })
  })
}

AttributesList.propTypes = {
  attributeDefs: PropTypes.array.isRequired,
  canSelectAttributes: PropTypes.bool,
  nodeDefContext: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  nodeDefUuidsAttributes: PropTypes.array,
  onToggleAttribute: PropTypes.func,
  showAncestorsLabel: PropTypes.bool,
}
