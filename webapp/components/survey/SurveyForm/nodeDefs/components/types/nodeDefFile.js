import './nodeDefFile.scss'

import React, { useCallback, useRef, useState } from 'react'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import UploadButton from '@webapp/components/form/uploadButton'
import { ButtonDownload } from '@webapp/components/buttons'
import Tooltip from '@webapp/components/tooltip'
import { LoadingBar } from '@webapp/components'
import { useI18n } from '@webapp/store/system'

import NodeDeleteButton from '../nodeDeleteButton'

const FilePreview = ({ nodeDef, path }) => {
  const i18n = useI18n()

  if (NodeDef.getFileType(nodeDef) !== NodeDef.fileTypeValues.image) return null

  const imgRef = useRef(null)
  const retriesRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const onError = useCallback(() => {
    // try to load again the image after 1 sec, then after 2 seconds, otherwise show a warning icon
    const retries = retriesRef.current
    if (retries <= 2) {
      setTimeout(() => {
        retriesRef.current = retries + 1
        imgRef.current.src = path
      }, 1000 * (retries + 1))
    } else {
      setLoading(false)
      setError(true)
    }
  }, [])

  return (
    <div className="survey-form__node-def-file__preview-image">
      {loading && <LoadingBar />}
      {!error && (
        <img
          ref={imgRef}
          onLoad={() => setLoading(false)}
          src={path}
          style={{ display: loading ? 'none' : 'block' }}
          onError={onError}
        />
      )}
      {error && (
        <span className="icon error icon-warning" title={i18n.t('surveyForm.nodeDefFile.errorLoadingPreview')} />
      )}
    </div>
  )
}

const handleFileChange = (nodeDef, node, file, updateNode) => {
  const value = {
    [Node.valuePropsFile.fileUuid]: uuidv4(),
    [Node.valuePropsFile.fileName]: file.name,
    [Node.valuePropsFile.fileSize]: file.size,
  }
  updateNode(nodeDef, node, value, file)
}

const handleNodeDelete = (nodeDef, node, removeNode, updateNode) => {
  if (NodeDef.isMultiple(nodeDef)) {
    removeNode(nodeDef, node)
  } else {
    // Do not delete single node, delete only its value
    updateNode(nodeDef, node, null)
  }
}

const FileInput = (props) => {
  const { surveyInfo, nodeDef, node, readOnly, edit, insideTable, canEditRecord, updateNode, removeNode } = props

  const fileName = Node.getFileName(node)
  const fileUploaded = !edit && fileName
  const fileUrl = `/api/survey/${surveyInfo.id}/record/${Node.getRecordUuid(node)}/nodes/${Node.getUuid(node)}/file`

  const filePreviewComponent = <FilePreview nodeDef={nodeDef} path={fileUrl} />
  const downloadButton = <ButtonDownload href={fileUrl} label={fileName} title={fileName} className="ellipsis" />

  return (
    <div className="survey-form__node-def-file">
      <UploadButton
        disabled={edit || !canEditRecord || readOnly}
        showLabel={false}
        onChange={(files) => handleFileChange(nodeDef, node, files[0], updateNode)}
      />

      {fileUploaded && (
        <>
          {
            // when displayed inside table, show the image preview in a tooltip
            insideTable && (
              <Tooltip
                className="survey-form__node-def-file__tooltip-preview"
                messageComponent={filePreviewComponent}
                type="info"
              >
                {downloadButton}
              </Tooltip>
            )
          }
          {
            // when displayed in a form, show the image preview in a container
            !insideTable && (
              <>
                {downloadButton}
                {filePreviewComponent}
              </>
            )
          }

          <NodeDeleteButton
            nodeDef={nodeDef}
            node={node}
            removeNode={(nodeDef, node) => handleNodeDelete(nodeDef, node, removeNode, updateNode)}
          />
        </>
      )}
    </div>
  )
}

const MultipleFileInput = (props) => {
  const { nodes } = props

  return (
    <div>
      {nodes.map((n, i) => (
        <FileInput key={i} {...props} node={n} />
      ))}
    </div>
  )
}

const NodeDefFile = (props) => (props.edit ? <FileInput {...props} /> : <MultipleFileInput {...props} />)

export default NodeDefFile
