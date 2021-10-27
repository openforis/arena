import './nodeDefFile.scss'

import React, { useEffect, useState } from 'react'
import axios from 'axios'

import { uuidv4 } from '@core/uuid'

import UploadButton from '@webapp/components/form/uploadButton'
import DownloadButton from '@webapp/components/form/downloadButton'
import Tooltip from '@webapp/components/tooltip'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import NodeDeleteButton from '../nodeDeleteButton'

const TooltipPreviewImage = ({ path }) => {
  const [imageUrl, setImageUrl] = useState(false)
  const [data, setData] = useState(false)
  const getImage = async () => {
    const { data } = await axios.get(path, {
      responseType: 'blob',
    })
    setData(data)
  }

  useEffect(() => {
    getImage()
    return () => {}
  }, [])

  useEffect(() => {
    if (data) {
      setImageUrl(URL.createObjectURL(data))
    }
  }, [data])

  return <div className="survey-form__node-def-file__preview-image">{imageUrl && <img src={imageUrl} />}</div>
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
  const { surveyInfo, nodeDef, node, readOnly, edit, canEditRecord, updateNode, removeNode } = props

  const fileName = Node.getFileName(node)
  const fileUploaded = !edit && fileName

  const renderPreviewComponent = () => {
    if (NodeDef.getFileType(nodeDef) !== NodeDef.fileTypeValues.image) return null
    return (
      <TooltipPreviewImage
        path={`/api/survey/${surveyInfo.id}/record/${Node.getRecordUuid(node)}/nodes/${Node.getUuid(node)}/file`}
      />
    )
  }

  return (
    <div className="survey-form__node-def-file">
      <UploadButton
        disabled={edit || !canEditRecord || readOnly}
        showLabel={false}
        onChange={(files) => handleFileChange(nodeDef, node, files[0], updateNode)}
      />

      {fileUploaded && (
        <React.Fragment>
          <Tooltip tooltipComponent={renderPreviewComponent} type="info">
            <DownloadButton
              href={`/api/survey/${surveyInfo.id}/record/${Node.getRecordUuid(node)}/nodes/${Node.getUuid(node)}/file`}
              label={fileName}
              title={fileName}
              className="ellipsis"
            />
          </Tooltip>

          <NodeDeleteButton
            nodeDef={nodeDef}
            node={node}
            removeNode={(nodeDef, node) => handleNodeDelete(nodeDef, node, removeNode, updateNode)}
          />
        </React.Fragment>
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
