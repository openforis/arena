import { useState } from 'react'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { FormItem } from '@webapp/components/form/Input'
import { useSurvey } from '@webapp/store/survey'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

import { useNodeDefEditReadOnly } from '../store'
import type { ArenaAnyNodeDef, ArenaValidation } from '@openforis/arena-core'

type AnalysisEntitySelectorProps = {
  onChange: (...args: any[]) => any
  nodeDef: ArenaAnyNodeDef
  validation: ArenaValidation
}

const AnalysisEntitySelector = (props: AnalysisEntitySelectorProps) => {
  const survey = useSurvey()
  const readOnly = useNodeDefEditReadOnly()

  const { nodeDef, onChange, validation } = props
  const [hadParent] = useState(A.isEmpty(NodeDef.getParentUuid(nodeDef)))

  return (
    <FormItem label="common.entity" className="node-def-edit__title">
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        nodeDefUuidEntity={NodeDef.getParentUuid(nodeDef)}
        onChange={onChange}
        showSingleEntities={false}
        disabled={readOnly || !hadParent}
        useNameAsLabel={true}
        validation={validation}
      />
    </FormItem>
  )
}

export default AnalysisEntitySelector
