import './ScriptEditor.scss'
// the ace modules below register themselves on the global ace, so it must be loaded first
import 'ace-builds'
import 'ace-builds/webpack-resolver'
import 'ace-builds/src-noconflict/mode-r'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

import { useEffect, useRef } from 'react'
import * as ace from 'ace-builds'
import AceEditor from 'react-ace'

const aceLangTools = ace.require('ace/ext/language_tools')
const { snippetCompleter, textCompleter, keyWordCompleter } = aceLangTools
const defaultCompleters = [snippetCompleter, textCompleter, keyWordCompleter]

type ScriptEditorProps = {
  name: string
  mode: 'r' | 'sql' | 'json' | 'javascript'
  completer?: {
    getCompletions: (...args: any[]) => any
  }
  height?: string
  width?: string
  script: string
  onChange: (...args: any[]) => any
  readOnly?: boolean
}

export const ScriptEditor = (props: ScriptEditorProps) => {
  const {
    completer = null,
    height = '200px',
    mode,
    name,
    onChange,
    readOnly = false,
    script,
    width = 'inherit',
  } = props

  const editorRef = useRef<AceEditor>(null)

  useEffect(() => {
    const { editor } = editorRef.current as AceEditor & { editor: ace.Ace.Editor & { completers: unknown[] } }

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
        readOnly,
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
