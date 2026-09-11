import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

describe('time node def: includeSeconds', () => {
  it('NodeDef.isSecondsIncluded is false when the prop is not set', () => {
    const nodeDef = { props: {} }
    expect(NodeDef.isSecondsIncluded(nodeDef)).toBe(false)
  })

  it('NodeDef.isSecondsIncluded is true when the prop is true', () => {
    const nodeDef = { props: { [NodeDef.propKeys.includeSeconds]: true } }
    expect(NodeDef.isSecondsIncluded(nodeDef)).toBe(true)
  })

  it('Node.getTimeSeconds reads the third part of an HH:mm:ss value', () => {
    const node = { value: '14:30:45' }
    expect(Node.getTimeSeconds(node)).toBe(45)
  })

  it('Node.getTimeSeconds defaults to 0 for an HH:mm value', () => {
    const node = { value: '14:30' }
    expect(Node.getTimeSeconds(node)).toBe(0)
  })
})
