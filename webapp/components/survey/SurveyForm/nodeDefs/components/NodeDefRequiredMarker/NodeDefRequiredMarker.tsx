import React from 'react'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { useI18n } from '@webapp/store/system'

type Props = {
  nodeDef: any
  // without parent node (e.g. table header, survey designer) only always required attributes are marked
  parentNode?: any
}

const isMarkedAsRequired = ({ nodeDef, parentNode }: Props): boolean => {
  // key attributes are always required: the key icon is enough
  if (NodeDef.isKey(nodeDef)) return false
  const validations = NodeDef.getValidations(nodeDef)
  if (NodeDefValidations.isRequired(validations)) return true
  return (
    NodeDefValidations.isRequiredIfDefined(validations) &&
    !!parentNode &&
    Node.isChildRequired(NodeDef.getUuid(nodeDef))(parentNode)
  )
}

export const NodeDefRequiredMarker = (props: Props) => {
  const i18n = useI18n()

  if (!isMarkedAsRequired(props)) return null

  return (
    <span className="survey-form__node-def-required-marker" title={i18n.t('common.required')}>
      *
    </span>
  )
}
