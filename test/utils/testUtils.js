import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import * as RecordUtils from './recordUtils'

const expectValueToBe = ({ survey, record, path, expectedValue }) => {
  const nodeValue = RecordUtils.findNodeValueByPath(path)(survey, record)
  expect(nodeValue).toBe(expectedValue)
}

const expectChildrenLengthToBe = ({ survey, record, path, childName, expectedLength }) => {
  const node = RecordUtils.findNodeByPath(path)(survey, record)
  const childDef = Survey.getNodeDefsArray(survey).find((nodeDef) => NodeDef.getName(nodeDef) === childName)
  const children = Record.getNodeChildrenByDefUuid(node, NodeDef.getUuid(childDef))(record)
  expect(children.length).toEqual(expectedLength)
}

export const TestUtils = {
  expectValueToBe,
  expectChildrenLengthToBe,
}
