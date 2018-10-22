import React from 'react'
import * as R from 'ramda'

import UploadButton from '../../../../commonComponents/form/uploadButton'
import DownloadButton from '../../../../commonComponents/form/downloadButton'
import NodeDefFormItem from './nodeDefFormItem'

import { getNodeValue } from '../../../../../common/record/node'
// import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

class NodeDefFile extends React.Component {

  render () {
    const {nodeDef, edit, nodes, updateNode, survey, record} = this.props

    const node = edit ? null : nodes[0]

    return (
      <NodeDefFormItem {...this.props}>
        <div className="node-def__file-wrapper">
          <UploadButton disabled={edit}
                        label="File upload"
                        onChange={files => updateNode(nodeDef, node, {fileName: files[0].name}, files[0])}/>
          {node &&
            <DownloadButton href={`/api/survey/${survey.id}/record/${record.id}/nodes/${node.uuid}/file`} disabled={R.isEmpty(getNodeValue(node))}/>
          }
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefFile
