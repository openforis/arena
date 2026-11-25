import './AttributesList.scss'

import { useMemo } from 'react'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import AttributeSelector from './AttributeSelector'

type AttributesListProps = {
  attributeDefs: any[]
  canSelectAttributes?: boolean
  nodeDefContext: ArenaAnyNodeDef
  nodeDefLabelType?: NodeDef.NodeDefLabelType
  nodeDefUuidsAttributes?: any[]
  onToggleAttribute?: (...args: any[]) => any
  showAncestorsLabel?: boolean
}

export const AttributesList = (props: AttributesListProps) => {
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

  return Object.entries(childDefsByParentUuid as Record<string, ArenaAnyNodeDef[]>).map(
    ([parentDefUuid, childDefs]) => {
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
    }
  )
}
