import './nodeDefFile.scss'

import React, { useState } from 'react'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import UploadButton from '@webapp/components/form/uploadButton'
import { ButtonDownload } from '@webapp/components/buttons'

import NodeDeleteButton from '../nodeDeleteButton'
import { ImagePreview } from './ImagePreview'
import { TooltipNew } from './TooltipNew'

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
              <TooltipNew leaveDelay={500} popperRenderer={() => <ImagePreview path={fileUrl} file={fileUploaded} />}>
                {downloadButton}
              </TooltipNew>
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
