import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const AnalysisEntitySelector = (props) => {
  const i18n = useI18n()
  const survey = useSurvey()

  const { nodeDef, onChange, validation } = props
  const [hadParent] = useState(A.isEmpty(NodeDef.getParentUuid(nodeDef)))

  return (
    <FormItem label={i18n.t('common.entity')} className="node-def-edit__title">
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        nodeDefUuidEntity={NodeDef.getParentUuid(nodeDef)}
        onChange={onChange}
        showSingleEntities={false}
        disabled={!hadParent}
        useNameAsLabel={true}
        validation={validation}
      />
    </FormItem>
  )
}

AnalysisEntitySelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  nodeDef: PropTypes.object.isRequired,
  validation: PropTypes.object.isRequired,
}

export default AnalysisEntitySelector
