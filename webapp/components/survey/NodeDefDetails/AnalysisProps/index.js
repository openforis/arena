import './AnalysisProps.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useI18n, useLang } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import { ScriptEditor } from '@webapp/components/ScriptEditor'
import { useSurvey } from '@webapp/store/survey'

const AnalysisProps = (props) => {
  const { state, Actions, nodeDef } = props
  const survey = useSurvey()

  const i18n = useI18n()
  const lang = useLang()

  const nodeDefItems = Survey.getNodeDefsArray(survey).map((_nodeDef) => {
    const parent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(_nodeDef))(survey)
    return {
      name: NodeDef.getName(_nodeDef),
      label: NodeDef.getLabel(_nodeDef, lang),
      parent,
    }
  })

  const variableNamesCompleter = {
    getCompletions: (_editor, _session, _pos, _prefix, callback) => {
      callback(
        null,
        nodeDefItems.map((_nodeDef) => ({
          caption: `${_nodeDef.name}: ${_nodeDef.label}`,
          value: `${NodeDef.getName(_nodeDef.parent)}$${_nodeDef.name}`,
          meta: 'Table',
        }))
      )
    },
  }
  const onChange = (newValue) => {
    Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.script, value: newValue })
  }

  return (
    <FormItem label={i18n.t('nodeDefEdit.advancedProps.script')} className="script-form">
      <ScriptEditor
        name="node_def_analysis_script"
        mode="r"
        script={
          NodeDef.getScript(nodeDef) ||
          `${NodeDef.getName(Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey))}$${NodeDef.getName(
            nodeDef
          )} <- NA`
        }
        onChange={onChange}
        completer={variableNamesCompleter}
      />
    </FormItem>
  )
}

AnalysisProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default AnalysisProps
