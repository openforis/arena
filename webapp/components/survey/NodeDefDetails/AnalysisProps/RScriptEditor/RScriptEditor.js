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
const maxCodesLineLength = 200

const getDefaultScript = ({ survey, nodeDef }) => {
  const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
  const parentDefName = NodeDef.getName(parentDef) || 'PARENT'
  const nodeDefName = NodeDef.getName(nodeDef) || 'NAME'
  return `${parentDefName}$${nodeDefName} <- NA`
}

const generateCodesPairs = ({ items, lang }) =>
  Object.values(items).map((item) => `'${CategoryItem.getCode(item)}', ${CategoryItem.getLabel(lang)(item)}`)

const wrapTextWithPrefix = ({ chunks, prefix, maxLineLength, separator = ' ' }) => {
  const maxContentLength = maxLineLength - prefix.length - 1

  if (maxContentLength <= 0) {
    return `${prefix} ${chunks.join(separator)}`
  }

  const lines = []
  let currentLine = ''

  chunks.forEach((chunk) => {
    const token = currentLine ? `${separator}${chunk}` : chunk

    if (currentLine.length + token.length <= maxContentLength) {
      currentLine += token
      return
    }

    if (currentLine) {
      lines.push(`${prefix} ${currentLine}`)
      currentLine = ''
    }

    currentLine = chunk
  })

  if (currentLine) {
    lines.push(`${prefix} ${currentLine}`)
  }

  return lines.join('\n')
}

const generateCodesCommentBlock = ({ items, lang }) => {
  const codesPairs = generateCodesPairs({ items, lang })
  return wrapTextWithPrefix({
    chunks: codesPairs,
    prefix: codesTextPrefix,
    maxLineLength: maxCodesLineLength,
    separator: '; ',
  })
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
    const scriptOrDefault = nodeDefScript || getDefaultScript({ survey, nodeDef })

    if (categoryUuid && NodeDef.getParentUuid(nodeDef)) {
      const { request } = API.fetchCategoryItems({
        surveyId: Survey.getId(survey),
        categoryUuid,
      })
      const {
        data: { items },
      } = await request

      const codesCommentBlock = generateCodesCommentBlock({ items, lang })

      if (scriptOrDefault.startsWith(codesTextPrefix)) {
        // replace existing codes comment block
        const scriptSplitted = scriptOrDefault.split('\n')
        let firstNonCodesLineIndex = 0

        while (
          firstNonCodesLineIndex < scriptSplitted.length &&
          scriptSplitted[firstNonCodesLineIndex].startsWith(codesTextPrefix)
        ) {
          firstNonCodesLineIndex += 1
        }

        return [codesCommentBlock, ...scriptSplitted.slice(firstNonCodesLineIndex)].join('\n')
      } else {
        // add codes text at the beginning of the script
        return `${codesCommentBlock}\n\n${scriptOrDefault}`
      }
    }
    return scriptOrDefault
  }, [categoryUuid, lang, nodeDef, survey])

  useEffect(() => {
    let isMounted = true
    generateLocalScript().then((script) => {
      if (isMounted) {
        setLocalScript(script)
      }
    })
    return () => {
      isMounted = false
    }
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
