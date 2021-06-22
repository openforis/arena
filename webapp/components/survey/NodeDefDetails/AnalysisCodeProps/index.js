import './AnalysisCodeProps.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as ace from 'ace-builds'
import AceEditor from 'react-ace'

import 'ace-builds/webpack-resolver'
import 'ace-builds/src-noconflict/mode-r'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import { useSurvey } from '@webapp/store/survey'

const AnalysisCodeProps = (props) => {
  const { state, Actions, nodeDef } = props
  const survey = useSurvey()

  const i18n = useI18n()

  React.useEffect(() => {
    const langTools = ace.require('ace/ext/language_tools')

    // data stub:
    const otherNodeDefs = Survey.getNodeDefsArray(survey).map((_nodeDef) => ({
      name: NodeDef.getName(_nodeDef),
      description: NodeDef.getLabel(_nodeDef),
    }))

    const sqlTablesCompleter = {
      getCompletions: (editor, session, pos, prefix, callback) => {
        callback(
          null,
          otherNodeDefs.map((table) => ({
            caption: `${table.name}: ${table.description}`,
            value: table.name,
            meta: 'Table',
          }))
        )
      },
    }

    langTools.addCompleter(sqlTablesCompleter)
  }, [])

  const onChange = (newValue) => {
    Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.script, value: newValue })
  }

  return (
    <FormItem label={i18n.t('nodeDefEdit.advancedProps.script')} className="script-form">
      <AceEditor
        mode="r"
        theme="github"
        onChange={onChange}
        name="SCRIPT"
        editorProps={{ $blockScrolling: true }}
        fontSize={14}
        showPrintMargin
        showGutter
        highlightActiveLine
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          useWorker: true,
          tabSize: 2,
        }}
        defaultValue={
          NodeDef.getScript(nodeDef) ||
          `${NodeDef.getName(Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey))}$${NodeDef.getName(
            nodeDef
          )} <- NA`
        }
      />
    </FormItem>
  )
}

AnalysisCodeProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default AnalysisCodeProps
