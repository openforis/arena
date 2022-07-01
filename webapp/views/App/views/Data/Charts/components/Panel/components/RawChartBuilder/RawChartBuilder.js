import React, { useCallback, useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'

import * as ace from 'ace-builds'
import AceEditor from 'react-ace'
import { useI18n } from '@webapp/store/system'
import PanelRight from '@webapp/components/PanelRight'

import 'ace-builds/webpack-resolver'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/ext-language_tools'

import './RawChartBuilder.scss'
import classNames from 'classnames'

const aceLangTools = ace.require('ace/ext/language_tools')
const { snippetCompleter, textCompleter, keyWordCompleter } = aceLangTools
const defaultCompleters = [snippetCompleter, textCompleter, keyWordCompleter]

const getDimensionsCompleter = ({ dimensions }) => {
  return {
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
}

const getAggregationsCompleter = () => {
  const aggregations = [
    [
      { value: 'count', caption: 'count: The total count of data objects in the group.' },
      { value: 'valid', caption: 'valid: The count of field values that are not missing or NaN.' },
      { value: 'missing', caption: "missing: The count of null, undefined, or empty string ('') field values." },
      { value: 'distinct', caption: 'distinct: The count of distinct field values.' },
      { value: 'sum', caption: 'sum: The sum of field values.' },
      { value: 'product', caption: 'product: The product of field values. ≥ 5.10' },
      { value: 'mean', caption: 'mean: The mean (average) field value.' },
      { value: 'average', caption: 'average: The mean (average) field value. Identical to mean.' },
      { value: 'variance', caption: 'variance: The sample variance of field values.' },
      { value: 'variancep', caption: 'variancep: The population variance of field values.' },
      { value: 'stdev', caption: 'stdev: The sample standard deviation of field values.' },
      { value: 'stdevp', caption: 'stdevp: The population standard deviation of field values.' },
      { value: 'stderr', caption: 'stderr: The standard error of field values.' },
      { value: 'median', caption: 'median: The median field value.' },
      { value: 'q1', caption: 'q1: The lower quartile boundary of field values.' },
      { value: 'q3', caption: 'q3: The upper quartile boundary of field values.' },
      {
        value: 'ci0',
        caption: 'ci0: The lower boundary of the bootstrapped 95% confidence interval of the mean field value.',
      },
      {
        value: 'ci1',
        caption: 'ci1: The upper boundary of the bootstrapped 95% confidence interval of the mean field value.',
      },
      { value: 'min', caption: 'min: The minimum field value.' },
      { value: 'max', caption: 'max: The maximum field value.' },
      { value: 'argmin', caption: 'argmin: An input data object containing the minimum field value.' },
      { value: 'argmax', caption: 'argmax: An input data object containing the maximum field value.' },
      { value: 'values', caption: 'values: The list of data objects in the group.' },
    ],
  ]
  return {
    getCompletions: (_editor, _session, _pos, _prefix, callback) => {
      callback(
        null,
        aggregations.map((aggregation) => ({
          ...aggregation,
          meta: 'Aggregations Operation',
        }))
      )
    },
  }
}

const populateVegaRawEditorCompleters =
  ({ dimensions }) =>
  (editor) => {
    // reset completers
    editor.completers = [...defaultCompleters]

    editor.completers.push(getDimensionsCompleter({ dimensions }))
    editor.completers.push(getAggregationsCompleter())
  }

const RawChartBuilder = ({ visible, spec, onUpdateSpec, dimensions }) => {
  const i18n = useI18n()
  const [draftSpec, setDraftSpec] = useState(A.stringify(spec, null, 2))
  const [draft, setDraft] = useState(false)
  const [helpOpened, setHelpOpened] = useState(false)
  const editorRef = useRef()

  const setSpecAsValue = useCallback(() => {
    editorRef.current.editor.session.setValue(A.stringify(spec, null, 2))
  }, [spec])

  const discardChanges = useCallback(setSpecAsValue, [setSpecAsValue])

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
    setSpecAsValue()
  }, [setSpecAsValue, visible])

  useEffect(() => {
    const { editor } = editorRef.current
    populateVegaRawEditorCompleters({ dimensions })(editor)
  }, [dimensions])

  const toggleHelp = useCallback(() => {
    setHelpOpened(!helpOpened)
  }, [helpOpened])

  return (
    <div className={classNames(`raw-chart-builder`, { visible })}>
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
        <div className="raw-chart-builder__buttons-container__left">
          <button onClick={discardChanges} disabled={!draft}>
            {i18n.t('common.reset')}
          </button>
          <button onClick={saveChanges} disabled={!draft}>
            {i18n.t('common.save')}
          </button>
        </div>
        <button onClick={toggleHelp}>
          <span className="icon icon-question icon-left icon-12px" />
          {i18n.t('common.help')}
        </button>
      </div>
      {helpOpened && (
        <PanelRight onClose={toggleHelp} header={i18n.t('common.help')} className="panel-vega-doc">
          <iframe
            width="100%"
            height="100%"
            src="https://vega.github.io/vega/docs"
            title="Vega help"
            frameBorder="0"
          ></iframe>
        </PanelRight>
      )}
    </div>
  )
}

RawChartBuilder.propTypes = {
  visible: PropTypes.bool.isRequired,
  spec: PropTypes.string.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
  dimensions: PropTypes.any,
}

export default RawChartBuilder
