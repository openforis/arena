import './nodeDefFile.scss'

import React from 'react'
import { uuidv4 } from '@core/uuid'

import UploadButton from '@webapp/components/form/uploadButton'
import { ButtonDownload } from '@webapp/components/buttons'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import NodeDeleteButton from '../nodeDeleteButton'

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
  const { surveyInfo, nodeDef, node, readOnly, edit, canEditRecord, updateNode, removeNode } = props

  const fileName = Node.getFileName(node)
  const fileUploaded = !edit && fileName

  return (
    <div className="survey-form__node-def-file">
      <UploadButton
        disabled={edit || !canEditRecord || readOnly}
        showLabel={false}
        onChange={(files) => handleFileChange(nodeDef, node, files[0], updateNode)}
      />

      {fileUploaded && (
        <>
          <ButtonDownload
            href={`/api/survey/${surveyInfo.id}/record/${Node.getRecordUuid(node)}/nodes/${Node.getUuid(node)}/file`}
            label={fileName}
            title={fileName}
            className="ellipsis"
          />

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
