import './RScriptEditor.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'

import { FormItem } from '@webapp/components/form/Input'
import { ScriptEditor } from '@webapp/components/ScriptEditor'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import * as API from '@webapp/service/api'

const RScriptEditor = (props) => {
  const [defaultLocalScript, setDefaultLocalScript] = useState('')

  const { state, Actions, nodeDef } = props
  const survey = useSurvey()

  const lang = useSurveyPreferredLang()

  const nodeDefItems = useMemo(
    () =>
      Survey.getNodeDefsArray(survey).map((_nodeDef) => {
        const parent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(_nodeDef))(survey)
        return {
          name: NodeDef.getName(_nodeDef),
          label: NodeDef.getLabel(_nodeDef, lang),
          parent,
        }
      }),
    [survey, lang]
  )

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
  const onChange = useCallback(
    (newValue) => {
      Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.script, value: newValue })
    },
    [Actions, state]
  )

  const getDefaultScript = useMemo(
    () =>
      `${NodeDef.getName(Survey.getNodeDefParent(nodeDef)(survey)) || 'PARENT'}$${
        NodeDef.getName(nodeDef) || 'NAME'
      } <- NA`,
    [nodeDef, survey]
  )

  const getScriptOrDefault = useCallback(
    () => NodeDef.getScript(nodeDef) || getDefaultScript(),
    [getDefaultScript, nodeDef]
  )

  useEffect(() => {
    setDefaultLocalScript(getScriptOrDefault())
  }, [])

  return (
    <FormItem label="nodeDefEdit.advancedProps.script" className="script-form">
      <ScriptEditor
        key={defaultLocalScript}
        name="node_def_analysis_script"
        mode="r"
        script={defaultLocalScript}
        onChange={onChange}
        completer={variableNamesCompleter}
        readOnly
      />
    </FormItem>
  )
}

RScriptEditor.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default RScriptEditor
