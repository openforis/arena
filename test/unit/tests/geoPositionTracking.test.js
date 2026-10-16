import * as NodeDef from '@core/survey/nodeDef'

const newGeoDef = (props = {}) => ({
  type: NodeDef.nodeDefType.geo,
  props: { cycles: ['0'], ...props },
})

describe('geo node def: positionTracking', () => {
  it('NodeDef.isPositionTracking is false when the prop is not set', () => {
    expect(NodeDef.isPositionTracking(newGeoDef())).toBe(false)
  })

  it('NodeDef.isPositionTracking is true when the prop is true', () => {
    expect(NodeDef.isPositionTracking(newGeoDef({ [NodeDef.propKeys.positionTracking]: true }))).toBe(true)
  })

  it('only single geo attributes can track the position', () => {
    expect(NodeDef.canBePositionTracking(newGeoDef())).toBe(true)
    expect(NodeDef.canBePositionTracking(newGeoDef({ [NodeDef.propKeys.multiple]: true }))).toBe(false)
    expect(NodeDef.canBePositionTracking({ type: NodeDef.nodeDefType.coordinate, props: {} })).toBe(false)
  })

  it('clearNotApplicableProps clears positionTracking in multiple geo attributes', () => {
    const multipleDef = newGeoDef({ [NodeDef.propKeys.multiple]: true, [NodeDef.propKeys.positionTracking]: true })
    expect(NodeDef.isPositionTracking(NodeDef.clearNotApplicableProps('0')(multipleDef))).toBe(false)

    const singleDef = newGeoDef({ [NodeDef.propKeys.positionTracking]: true })
    expect(NodeDef.isPositionTracking(NodeDef.clearNotApplicableProps('0')(singleDef))).toBe(true)
  })
})
