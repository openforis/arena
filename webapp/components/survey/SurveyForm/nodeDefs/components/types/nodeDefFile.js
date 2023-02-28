import './nodeDefFile.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import UploadButton from '@webapp/components/form/uploadButton'
import { ButtonDownload } from '@webapp/components/buttons'
import Tooltip from '@webapp/components/tooltip'
import { LoadingBar } from '@webapp/components'
import { useOnUpdate } from '@webapp/components/hooks'

import { useI18n } from '@webapp/store/system'

import NodeDeleteButton from '../nodeDeleteButton'

const ImagePreview = ({ path, file = null }) => {
  const i18n = useI18n()

  const imgRef = useRef(null)
  const retriesRef = useRef(0)
  const retryTimeoutRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // reset retry timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  useOnUpdate(() => {
    setLoading(true)
    setError(false)
    retriesRef.current = 0
    clearTimeout(retryTimeoutRef.current)
  }, [path, file])

  // used the file blob if specified, to avoid downloading the file from the path
  const imgSrc = file ? URL.createObjectURL(file) : path

  const onError = useCallback(() => {
    // try to load again the image after 1 sec, then after 2 seconds, otherwise show a warning icon
    const retries = retriesRef.current
    if (retries <= 2) {
      retryTimeoutRef.current = setTimeout(() => {
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
          src={imgSrc}
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

const FileInput = (props) => {
  const { surveyInfo, nodeDef, node, readOnly, edit, canEditRecord, updateNode, removeNode } = props

  const [fileUploaded, setFileUploaded] = useState(null)
  const fileName = Node.getFileName(node)
  const fileReady = !edit && fileName
  const fileUrl = `/api/survey/${surveyInfo.id}/record/${Node.getRecordUuid(node)}/nodes/${Node.getUuid(node)}/file`

  const handleFileChange = (file) => {
    const value = {
      [Node.valuePropsFile.fileUuid]: uuidv4(),
      [Node.valuePropsFile.fileName]: file.name,
      [Node.valuePropsFile.fileSize]: file.size,
    }
    updateNode(nodeDef, node, value, file)
    setFileUploaded(file)
  }

  const handleNodeDelete = () => {
    if (NodeDef.isMultiple(nodeDef)) {
      removeNode(nodeDef, node)
    } else {
      // Do not delete single node, delete only its value
      updateNode(nodeDef, node, null)
    }
  }

  const isImage = NodeDef.getFileType(nodeDef) === NodeDef.fileTypeValues.image

  const downloadButton = <ButtonDownload href={fileUrl} label={fileName} title={fileName} className="btn-s ellipsis" />

  return (
    <div className="survey-form__node-def-file">
      <UploadButton
        className="btn-s"
        disabled={edit || !canEditRecord || readOnly}
        showLabel={false}
        onChange={(files) => handleFileChange(files[0])}
        maxSize={NodeDef.getMaxFileSize(nodeDef)}
      />

      {fileReady && (
        <>
          {
            // when file is an image, show the image preview in a tooltip
            isImage && (
              <Tooltip
                className="survey-form__node-def-file__tooltip-preview"
                messageComponent={<ImagePreview nodeDef={nodeDef} path={fileUrl} file={fileUploaded} />}
                type="info"
              >
                {downloadButton}
              </Tooltip>
            )
          }
          {!isImage && downloadButton}

          <NodeDeleteButton nodeDef={nodeDef} node={node} removeNode={handleNodeDelete} />
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
