import './ScriptEditor.scss'

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import AceEditor from 'react-ace'
import * as ace from 'ace-builds'

import 'ace-builds/webpack-resolver'
import 'ace-builds/src-noconflict/mode-r'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

const aceLangTools = ace.require('ace/ext/language_tools')
const { snippetCompleter, textCompleter, keyWordCompleter } = aceLangTools
const defaultCompleters = [snippetCompleter, textCompleter, keyWordCompleter]

export const ScriptEditor = (props) => {
  const { name, mode, script, completer, height, width, onChange } = props

  const editorRef = useRef()

  useEffect(() => {
    const { editor } = editorRef.current

    // reset completers
    editor.completers = [...defaultCompleters]

    // add custom completer (if any)
    if (completer) {
      editor.completers.push(completer)
    }
  }, [completer])

  return (
    <AceEditor
      ref={editorRef}
      mode={mode}
      theme="github"
      onChange={onChange}
      name={name}
      editorProps={{ $blockScrolling: true }}
      fontSize={16}
      showPrintMargin
      showGutter
      highlightActiveLine
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        showLineNumbers: true,
        useWorker: true,
        tabSize: 2,
      }}
      defaultValue={script}
      height={height}
      width={width}
    />
  )
}

ScriptEditor.propTypes = {
  name: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['r', 'sql', 'json']).isRequired,
  completer: PropTypes.shape({
    getCompletions: PropTypes.func.isRequired,
  }),
  height: PropTypes.string,
  width: PropTypes.string,
  script: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

ScriptEditor.defaultProps = {
  completer: null,
  height: '200px',
  width: 'inherit',
}
