import './nodeDefFile.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import { uuidv4 } from '@core/uuid'

import { ButtonDownload } from '@webapp/components/buttons'
import UploadButton from '@webapp/components/form/uploadButton'
import { TooltipNew } from '@webapp/components/TooltipNew'

import NodeDeleteButton from '../nodeDeleteButton'

import { ImagePreview } from './ImagePreview'

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

  const downloadButton = (
    <ButtonDownload href={fileUrl} label={fileName} title={isImage ? undefined : fileName} className="btn-s ellipsis" />
  )

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
              <TooltipNew
                className="image-preview-tooltip"
                renderTitle={() => <ImagePreview path={fileUrl} file={fileUploaded} />}
              >
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

FileInput.propTypes = {
  surveyInfo: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
  node: PropTypes.object,
  readOnly: PropTypes.bool,
  edit: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  updateNode: PropTypes.func.isRequired,
  removeNode: PropTypes.func.isRequired,
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

MultipleFileInput.propTypes = {
  nodes: PropTypes.array.isRequired,
}

const NodeDefFile = (props) => (props.edit ? <FileInput {...props} /> : <MultipleFileInput {...props} />)

NodeDefFile.propTypes = {
  edit: PropTypes.bool,
}

export default NodeDefFile
