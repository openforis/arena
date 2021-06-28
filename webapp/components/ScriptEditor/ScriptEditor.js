import React, { useEffect, useRef } from 'react'

import AceEditor from 'react-ace'
import * as ace from 'ace-builds'

const aceLangTools = ace.require('ace/ext/language_tools')
const { textCompleter, keyWordCompleter } = aceLangTools
const defaultCompleters = [textCompleter, keyWordCompleter]

export const ScriptEditor = (props) => {
  const { name, mode, completer, script, onChange } = props

  const editorRef = useRef()

  useEffect(() => {
    const { editor } = editorRef.current

    // reset completers
    editor.completers = [...defaultCompleters]

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
      height="150px"
    />
  )
}
