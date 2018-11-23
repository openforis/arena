import React from 'react'
import * as R from 'ramda'

import UploadButton from '../../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../../commonComponents/form/downloadButton'
import NodeDeleteButton from '../nodeDeleteButton'

import { limitToParentHeight } from '../../../../../appUtils/domUtils'

import { getNodeValue, getNodeFileName } from '../../../../../../common/record/node'
import NodeDef from '../../../../../../common/survey/nodeDef'

const getFileExtension = R.pipe(
  getNodeFileName,
  R.split('.'),
  R.tail,
)

const getFileName = node => R.pipe(
  getNodeFileName,
  fileName => R.slice(0, fileName.lastIndexOf('.'))(fileName),
  fileName => fileName.length > 15
    ? R.slice(0, 15, fileName) + '..'
    : fileName,
  fileName => R.isEmpty(fileName)
    ? ''
    : fileName + '.' + getFileExtension(node)
)(node)

const FileInput = ({surveyInfo, nodeDef, edit, recordId, node, updateNode, removeNode}) =>
  node
    ? <div className="node-def__file-input">
      <UploadButton disabled={edit}
                    showLabel={false}
                    onChange={files => updateNode(nodeDef, node, {fileName: files[0].name}, files[0])}/>

      <DownloadButton href={`/api/survey/${surveyInfo.id}/record/${recordId}/nodes/${node.uuid}/file`}
                      disabled={edit || R.isEmpty(getNodeValue(node))}
                      label={getFileName(node)}
                      title={getNodeFileName(node) === getFileName(node) ? null : getNodeFileName(node)}/>

      <NodeDeleteButton nodeDef={nodeDef}
                        node={node}
                        disabled={edit || R.isEmpty(getNodeValue(node))}
                        showConfirm={true}
                        removeNode={removeNode}/>
    </div>
    : null

const MultipleFileInput = props => {
  const {nodes} = props

  return <div className="overflowYAuto"
              ref={elem => limitToParentHeight(elem)}>
    {
      nodes.map((n, i) =>
        <FileInput key={i}
                   {...props}
                   node={n}/>
      )
    }
  </div>
}

const NodeDefFile = props =>
  props.edit
    ? <FileInput {...props}/>
    : NodeDef.isNodeDefMultiple(props.nodeDef)
    ? <MultipleFileInput {...props}/>
    : <FileInput {...props} node={props.nodes[0]}/>

export default NodeDefFile
