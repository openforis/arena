import './nodeDefFile.scss'

import React from 'react'
import { uuidv4 } from '@core/uuid'

import UploadButton from '@webapp/commonComponents/form/uploadButton'
import DownloadButton from '@webapp/commonComponents/form/downloadButton'
import NodeDeleteButton from '../nodeDeleteButton'

import NodeDef from '@core/survey/nodeDef'
import Node from '@core/record/node'
import RecordFile from '@core/record/recordFile'

const handleFileChange = (nodeDef, node, file, updateNode) => {
  const value = {
    [Node.valuePropKeys.fileUuid]: uuidv4(),
    [Node.valuePropKeys.fileName]: file.name,
    [Node.valuePropKeys.fileSize]: file.size
  }
  updateNode(nodeDef, node, value, file)
}

const handleNodeDelete = (nodeDef, node, removeNode, updateNode) => {
  if (NodeDef.isMultiple(nodeDef)) {
    removeNode(nodeDef, node)
  } else {
    // do not delete single node, delete only its value
    updateNode(nodeDef, node, null)
  }
}

const FileInput = props => {
  const {
    surveyInfo, nodeDef, node,
    readOnly, edit, canEditRecord,
    updateNode, removeNode
  } = props

  const fileName = Node.getFileName(node)
  const truncatedFileName = RecordFile.truncateFileName(fileName)
  const fileUploaded = !edit && fileName

  return (
    <div className="survey-form__node-def-file">
      <UploadButton
        disabled={edit || !canEditRecord || readOnly}
        showLabel={false}
        onChange={files => handleFileChange(nodeDef, node, files[0], updateNode)}/>

      {
        fileUploaded &&
        <React.Fragment>
          <DownloadButton
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
        </React.Fragment>
      }
    </div>
  )
}

const MultipleFileInput = props => {
  const { nodes } = props

  return (
    <div>
      {
        nodes.map((n, i) =>
          <FileInput
            key={i}
            {...props}
            node={n}/>
        )
      }
    </div>
  )
}

const NodeDefFile = props =>
  props.edit
    ? <FileInput {...props}/>
    : <MultipleFileInput {...props}/>

export default NodeDefFile
