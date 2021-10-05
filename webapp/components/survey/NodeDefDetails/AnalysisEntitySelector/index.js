import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

const AnalysisEntitySelector = (props) => {
  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const { nodeDef, onChange } = props
  const [hadParent] = useState(A.isEmpty(NodeDef.getParentUuid(nodeDef)))

  return (
    <FormItem label={i18n.t('common.entity')} className="node-def-edit__title">
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        lang={lang}
        nodeDefUuidEntity={NodeDef.getParentUuid(nodeDef)}
        onChange={onChange}
        showSingleEntities={false}
        disabled={!hadParent}
        useNameAsLabel={true}
      />
    </FormItem>
  )
}

AnalysisEntitySelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default AnalysisEntitySelector
