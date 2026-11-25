import type React from 'react'

import type { ArenaAnyNodeDef, ArenaRecordNode } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import ErrorBadge from '@webapp/components/ErrorBadge'
import { TestId } from '@webapp/utils/testId'

import useValidation from './useValidation'

type NodeDefErrorBadgeProps = {
  children?: React.ReactNode
  edit?: boolean
  insideTable?: boolean
  node?: ArenaRecordNode // Passed when validating a single node of a nodeDef multiple
  nodeDef: ArenaAnyNodeDef
  nodes?: any[]
  parentNode?: ArenaRecordNode
}

const NodeDefErrorBadge = (props: NodeDefErrorBadgeProps) => {
  const {
    children = null,
    edit = false,
    insideTable = false,
    node = null,
    nodeDef,
    nodes = null,
    parentNode = null,
  } = props
  const validation = useValidation({ edit, node, nodeDef, nodes, parentNode })

  return (
    <ErrorBadge
      validation={validation}
      showIcon
      showLabel={false}
      showKeys={false}
      className="error-badge-inverse survey-form__node-def-error-badge"
      id={TestId.surveyForm.nodeDefErrorBadge(NodeDef.getName(nodeDef))}
      insideTable={insideTable}
    >
      {children}
    </ErrorBadge>
  )
}

export default NodeDefErrorBadge
