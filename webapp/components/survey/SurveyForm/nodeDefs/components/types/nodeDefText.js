import './nodeDefText.scss'

import React from 'react'
import classNames from 'classnames'

import { Strings } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Node from '@core/record/node'

import { Link, Markdown } from '@webapp/components'
import { Input } from '@webapp/components/form/Input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDeleteButton from '../nodeDeleteButton'

const extractSingleDefaultValueExpression = (nodeDef) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  if (defaultValues?.length === 1) {
    const defaultValue = defaultValues[0]
    return NodeDefExpression.getExpression(defaultValue)
  }
  return null
}

const extractConstantHyperlinkValue = (nodeDef) => {
  const expr = extractSingleDefaultValueExpression(nodeDef)
  const validUrlPrefixes = ['http://', 'https://']
  return validUrlPrefixes.some((prefix) => expr?.startsWith(`"${prefix}`)) ? Strings.unquoteDouble(expr) : null
}

const extractConstantMarkdownValue = (nodeDef) => {
  const expr = extractSingleDefaultValueExpression(nodeDef)
  return A.pipe(Strings.removePrefix(`"`), Strings.removeSuffix('\n'), Strings.removeSuffix('"'))(expr)
}

const TextInput = ({ nodeDef, readOnly, node, edit, updateNode, canEditRecord }) => {
  const multiline = NodeDef.getTextInputType(nodeDef) === NodeDef.textInputTypes.multiLine
  return (
    <div className={classNames(`survey-form__node-def-${NodeDef.getType(nodeDef)}`, { multiline })}>
      <Input
        disabled={edit || !canEditRecord || readOnly}
        numberFormat={NodeDefUIProps.getNumberFormat(nodeDef)}
        inputType={multiline ? 'textarea' : 'input'}
        textTransformFunction={NodeDef.getTextTransformFunction(nodeDef)}
        value={Node.getValue(node, '')}
        onChange={(value) => updateNode(nodeDef, node, value)}
      />
    </div>
  )
}

const MultipleTextInput = (props) => {
  const { nodeDef, parentNode, nodes, canEditRecord } = props
  const nodeDefType = NodeDef.getType(nodeDef)

  return (
    <>
      {nodes.map(
        (n) =>
          (!Node.isPlaceholder(n) || canEditRecord) && (
            <div
              key={Node.getUuid(n)}
              className={`survey-form__node-def-text-multiple-container survey-form__node-def-${nodeDefType}`}
            >
              <NodeDefErrorBadge nodeDef={nodeDef} edit={false} parentNode={parentNode} node={n} />

              <TextInput {...props} node={n} />

              {!n.placeholder && NodeDef.isMultiple(nodeDef) && canEditRecord && (
                <NodeDeleteButton nodeDef={nodeDef} node={n} showConfirm={true} />
              )}
            </div>
          )
      )}
    </>
  )
}

const NodeDefText = (props) => {
  const { edit, entryDataQuery, nodeDef, nodes, surveyCycleKey } = props

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)
  const isReadOnly = NodeDef.isReadOnly(nodeDef)
  const isHyperlink = isReadOnly && renderType === NodeDefLayout.textRenderType.hyperlink
  const isMarkdown = isReadOnly && renderType === NodeDefLayout.textRenderType.markdown
  if (edit) {
    if (isReadOnly) {
      if (isHyperlink) {
        const hyperlink = extractConstantHyperlinkValue(nodeDef) ?? 'https://www.example-link.org'
        return <Link disabled href="#" label={hyperlink} />
      }
      if (isMarkdown) {
        const markdown = extractConstantMarkdownValue(nodeDef)
        if (markdown) {
          return <Markdown source={markdown} />
        }
      }
    }
    return <TextInput {...props} />
  }
  if (NodeDef.isMultiple(nodeDef) && !entryDataQuery) {
    return <MultipleTextInput {...props} />
  }
  const node = nodes[0]
  if (isReadOnly) {
    if (isHyperlink) {
      return <Link href={Node.getValue(node, '')} />
    }
    if (isMarkdown) {
      const text = Node.getValue(node, '')
      return <Markdown source={text} />
    }
  }
  return <TextInput {...props} node={node} />
}

export default NodeDefText
