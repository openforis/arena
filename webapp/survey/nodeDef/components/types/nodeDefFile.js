import React from 'react'
import * as R from 'ramda'

import UploadButton from '../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../commonComponents/form/downloadButton'
import NodeDefFormItem from './nodeDefFormItem'

import { getNodeValue, getNodeFileName } from '../../../../../common/record/node'

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

class NodeDefFile extends React.Component {

  render () {
    const {nodeDef, edit, nodes, updateNode, survey, record} = this.props

    const node = edit ? null : nodes[0]

    return (
      <NodeDefFormItem {...this.props}>
        <div className="node-def__file-wrapper">
          <UploadButton disabled={edit}
                        showLabel={false}
                        onChange={files => updateNode(nodeDef, node, {fileName: files[0].name}, files[0])}/>
          {node &&
          <DownloadButton href={`/api/survey/${survey.id}/record/${record.id}/nodes/${node.uuid}/file`}
                          disabled={R.isEmpty(getNodeValue(node))}
                          label={getFileName(node)}/>
          }
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefFile
