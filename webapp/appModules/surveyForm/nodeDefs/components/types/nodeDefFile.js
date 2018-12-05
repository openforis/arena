import React from 'react'

import UploadButton from '../../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../../commonComponents/form/downloadButton'
import NodeDeleteButton from '../nodeDeleteButton'

import Node from '../../../../../../common/record/node'
import File from '../../../../../../common/file/file'

const FileInput = ({surveyInfo, nodeDef, edit, recordId, node, updateNode, removeNode}) => {
  const fileName = Node.getNodeFileName(node)
  const truncatedFileName = File.truncateFileName(fileName)
  const fileUploaded = !edit && fileName

  return <div className="node-def__file-input">
    <UploadButton disabled={edit}
                  showLabel={false}
                  onChange={files => updateNode(nodeDef, node, null, files[0])}/>

    <DownloadButton href={`/api/survey/${surveyInfo.id}/record/${recordId}/nodes/${node.uuid}/file`}
                    disabled={!fileUploaded}
                    label={truncatedFileName}
                    title={fileName === truncatedFileName ? null : fileName}/>

    <NodeDeleteButton nodeDef={nodeDef}
                      node={node}
                      disabled={!fileUploaded}
                      showConfirm={true}
                      removeNode={removeNode}/>
  </div>
}

const MultipleFileInput = props => {
  const {nodes} = props

  return <div className="node-def__entry-multiple">
    <div className="nodes">
      {
        nodes.map((n, i) =>
          <FileInput key={i}
                     {...props}
                     node={n}/>
        )
      }
    </div>
  </div>
}

const NodeDefFile = props =>
  props.edit
    ? <FileInput {...props}/>
    : <MultipleFileInput {...props}/>

export default NodeDefFile
