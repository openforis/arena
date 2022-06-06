import React, { useCallback, useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'

import AceEditor from 'react-ace'
import { useI18n } from '@webapp/store/system'

import './RawChartBuilder.scss'

const RawChartBuilder = ({ spec, onUpdateSpec }) => {
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
            enableBasicAutocompletion: false,
            enableLiveAutocompletion: false,
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
}

export default RawChartBuilder
