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

const codesTextPrefix = '# __CODES__'

const getDefaultScript = ({ survey, nodeDef }) => {
  const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
  const parentDefName = NodeDef.getName(parentDef) || 'PARENT'
  const nodeDefName = NodeDef.getName(nodeDef) || 'NAME'
  return `${parentDefName}$${nodeDefName} <- NA`
}

const RScriptEditor = (props) => {
  const { state, Actions, nodeDef } = props

  const [localScript, setLocalScript] = useState('')

  const survey = useSurvey()

  const lang = useSurveyPreferredLang()

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)

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

  const generateLocalScript = useCallback(async () => {
    const nodeDefScript = NodeDef.getScript(nodeDef)

    if (categoryUuid) {
      const { request } = API.fetchCategoryItems({
        surveyId: Survey.getId(survey),
        categoryUuid,
      })
      const {
        data: { items },
      } = await request

      let newScript = ''
      const generateCodesText = (_items) =>
        Object.values(_items)
          .map((_item) => `'${CategoryItem.getCode(_item)}', ${CategoryItem.getLabel(lang)(_item)} `)
          .join('; ')

      if (NodeDef.getParentUuid(nodeDef)) {
        const scriptOrDefault = nodeDefScript || getDefaultScript({ survey, nodeDef })
        const codesText = generateCodesText(items)

        if (scriptOrDefault.startsWith(codesTextPrefix)) {
          // replace existing codes text
          const scriptSplitted = scriptOrDefault.split('\n')
          scriptSplitted[0] = `${codesTextPrefix} ${codesText}`
          newScript = scriptSplitted.join('\n')
        } else {
          // add codes text at the beginning of the script
          newScript = `${codesTextPrefix} ${codesText}\n${scriptOrDefault}`
        }
      }
      return newScript
    }
    return nodeDefScript
  }, [categoryUuid, lang, nodeDef, survey])

  useEffect(() => {
    generateLocalScript().then((script) => {
      setLocalScript(script)
    })
  }, [generateLocalScript])

  return (
    <FormItem label="nodeDefEdit.advancedProps.script" className="script-form">
      <ScriptEditor
        key={localScript}
        name="node_def_analysis_script"
        mode="r"
        script={localScript}
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
