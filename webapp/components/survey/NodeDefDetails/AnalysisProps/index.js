import './AnalysisProps.scss'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'

import { useI18n, useLang } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import { ScriptEditor } from '@webapp/components/ScriptEditor'
import { useSurvey } from '@webapp/store/survey'
import * as API from '@webapp/service/api'

const AnalysisProps = (props) => {
  const [defaultLocalScript, setDefaultLocalScript] = useState('')
  
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

  const getDefaultScript = () =>
    `${Survey.getNodeDefParent(nodeDef)(survey) || 'PARENT'}$${
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
    if (/^# __CODES__/.test(currentScript)) {
      const scriptSplitted = currentScript.split('\n')
      scriptSplitted[0] = `# __CODES__ ${Object.values(items)
        .map((item) => `${CategoryItem.getCode(item)}, ${CategoryItem.getLabel(lang)(item)} `)
        .join('; ')}`
      newScript = scriptSplitted.join('\n')
    } else {
      newScript = `# __CODES__ ${Object.values(items)
        .map((item) => `${CategoryItem.getCode(item)}, ${CategoryItem.getLabel(lang)(item)} `)
        .join('; ')}\n${getScriptOrDefault()}`
    }

    onChange(newScript)
    setDefaultLocalScript(newScript)
  }

  useEffect(() => {
    if (NodeDef.getCategoryUuid(nodeDef)) {
      generatePreScriptWithCategories()
    }
  }, [NodeDef.getCategoryUuid(nodeDef), NodeDef.getParentUuid(nodeDef)])

  useEffect(() =>{
    setDefaultLocalScript(getScriptOrDefault())
  },[])


  return (
    <FormItem label={i18n.t('nodeDefEdit.advancedProps.script')} className="script-form"> 
      <ScriptEditor
      key={defaultLocalScript}
        name="node_def_analysis_script"
        mode="r"
        script={defaultLocalScript}
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
