import './RScriptEditor.scss'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'

import { useLang } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import { ScriptEditor } from '@webapp/components/ScriptEditor'
import { useSurvey } from '@webapp/store/survey'
import * as API from '@webapp/service/api'

const RScriptEditor = (props) => {
  const [defaultLocalScript, setDefaultLocalScript] = useState('')

  const { state, Actions, nodeDef } = props
  const survey = useSurvey()

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

  const getDefaultScript = () =>
    `${NodeDef.getName(Survey.getNodeDefParent(nodeDef)(survey)) || 'PARENT'}$${
      NodeDef.getName(nodeDef) || 'NAME'
    } <- NA`

  const getScriptOrDefault = () => NodeDef.getScript(nodeDef) || getDefaultScript()

  const generatePreScriptWithCategories = async () => {
    const { request } = API.fetchCategoryItems({
      surveyId: Survey.getId(survey),
      categoryUuid: NodeDef.getCategoryUuid(nodeDef),
    })
    const {
      data: { items },
    } = await request

    const currentScript = NodeDef.getScript(nodeDef)
    let newScript = ''
    const generateCodesText = (_items) =>
      Object.values(_items)
        .map((_item) => `'${CategoryItem.getCode(_item)}', ${CategoryItem.getLabel(lang)(_item)} `)
        .join('; ')

    if (NodeDef.getParentUuid(nodeDef) && NodeDef.getCategoryUuid(nodeDef)) {
      if (/^# __CODES__/.test(currentScript)) {
        const scriptSplitted = currentScript.split('\n')
        scriptSplitted[0] = `# __CODES__ ${generateCodesText(items)}`
        newScript = scriptSplitted.join('\n')
      } else {
        newScript = `# __CODES__ ${generateCodesText(items)}\n${getScriptOrDefault()}`
      }
    }

    onChange(newScript)
    setDefaultLocalScript(newScript)
  }

  useEffect(() => {
    if (NodeDef.getCategoryUuid(nodeDef)) {
      generatePreScriptWithCategories()
    }
  }, [NodeDef.getCategoryUuid(nodeDef), NodeDef.getParentUuid(nodeDef)])

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
