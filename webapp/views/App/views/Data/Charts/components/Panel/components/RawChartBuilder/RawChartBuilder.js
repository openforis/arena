import React, { useCallback, useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'

import AceEditor from 'react-ace'
import { useI18n } from '@webapp/store/system'

import 'ace-builds/webpack-resolver'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

const aceLangTools = ace.require('ace/ext/language_tools')
const { snippetCompleter, textCompleter, keyWordCompleter } = aceLangTools
const defaultCompleters = [snippetCompleter, textCompleter, keyWordCompleter]

import './RawChartBuilder.scss'

const RawChartBuilder = ({ spec, onUpdateSpec, dimensions }) => {
  const i18n = useI18n()
  const [draftSpec, setDraftSpec] = useState(A.stringify(spec, null, 2))
  const [draft, setDraft] = useState(false)
  const editorRef = useRef()

  const discardChanges = useCallback(() => {
    editorRef.current.editor.session.setValue(A.stringify(spec, null, 2))
  }, [])

  const saveChanges = useCallback(() => {
    onUpdateSpec(draftSpec)
  }, [onUpdateSpec, draftSpec])

  const onChange = useCallback((newSpec) => {
    setDraftSpec(newSpec)
    setDraft(true)
  }, [])

  useEffect(() => {
    setDraft(false)
  }, [spec])

  useEffect(() => {
    const { editor } = editorRef.current

    // reset completers
    editor.completers = [...defaultCompleters]

    const dimensionsCompleter = {
      getCompletions: (_editor, _session, _pos, _prefix, callback) => {
        callback(
          null,
          dimensions
            .flatMap((group) => group.options || [])
            .map((dimension) => ({
              caption: `${dimension.name}: ${dimension.label}`,
              value: `${dimension.name}`,
              meta: 'Dimensions',
            }))
        )
      },
    }

    editor.completers.push(dimensionsCompleter)
  }, [dimensions])

  return (
    <div className="raw-chart-builder">
      <div className="raw-chart-builder__editor">
        <AceEditor
          ref={editorRef}
          mode="json"
          theme="github"
          fontSize={10}
          showPrintMargin
          showGutter
          highlightActiveLine
          defaultValue={draftSpec}
          onChange={onChange}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            showLineNumbers: true,
            useWorker: true,
            tabSize: 2,
          }}
          width="100%"
          height="100%"
        />
      </div>

      <div className="raw-chart-builder__buttons-container">
        <button onClick={discardChanges} disabled={!draft}>
          {i18n.t('common.reset')}
        </button>
        <button onClick={saveChanges} disabled={!draft}>
          {i18n.t('common.save')}
        </button>
      </div>
    </div>
  )
}

RawChartBuilder.propTypes = {
  spec: PropTypes.string.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
  dimensions: PropTypes.any,
}

export default RawChartBuilder
