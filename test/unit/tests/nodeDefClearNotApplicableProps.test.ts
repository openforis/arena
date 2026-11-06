import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

const { keysPropsAdvanced, nodeDefType, propKeys } = NodeDef

const cycle = '0'

const clear = NodeDef.clearNotApplicableProps(cycle)

const newTextDef = ({ props = {}, layout = {}, propsAdvanced = {} } = {}) => ({
  type: nodeDefType.text,
  props: { cycles: [cycle], ...props, [NodeDefLayout.keys.layout]: { [cycle]: layout } },
  propsAdvanced,
})

describe('NodeDef.clearNotApplicableProps', () => {
  it('returns the same node def when there is nothing to clear', () => {
    const nodeDef = newTextDef({ props: { [propKeys.readOnly]: true, [propKeys.hidden]: true } })
    expect(clear(nodeDef)).toBe(nodeDef)
  })

  it('clears hidden only when the attribute is not read only', () => {
    expect(NodeDef.isHidden(clear(newTextDef({ props: { [propKeys.hidden]: true } })))).toBe(false)
    const readOnlyDef = newTextDef({ props: { [propKeys.hidden]: true, [propKeys.readOnly]: true } })
    expect(NodeDef.isHidden(clear(readOnlyDef))).toBe(true)
  })

  it('clears the hyperlink render type only when the text attribute is not read only', () => {
    const layout = { [NodeDefLayout.keys.renderType]: NodeDefLayout.textRenderType.hyperlink }
    const getRenderType = NodeDefLayout.getRenderType(cycle)
    expect(getRenderType(clear(newTextDef({ layout })))).toBe(NodeDefLayout.textRenderType.text)
    const readOnlyDef = newTextDef({ props: { [propKeys.readOnly]: true }, layout })
    expect(getRenderType(clear(readOnlyDef))).toBe(NodeDefLayout.textRenderType.hyperlink)
  })

  it('clears autoCreateMinCountItems only in single entities', () => {
    const newEntityDef = (multiple: boolean) => ({
      type: nodeDefType.entity,
      props: { [propKeys.multiple]: multiple, [propKeys.autoCreateMinCountItems]: true },
    })
    expect(NodeDef.isAutoCreateMinCountItems(clear(newEntityDef(false)))).toBe(false)
    expect(NodeDef.isAutoCreateMinCountItems(clear(newEntityDef(true)))).toBe(true)
  })

  it('clears hiddenWhenNotRelevant only when there are no relevance conditions', () => {
    const layout = { [NodeDefLayout.keys.hiddenWhenNotRelevant]: true }
    const isHiddenWhenNotRelevant = NodeDefLayout.isHiddenWhenNotRelevant(cycle)
    expect(isHiddenWhenNotRelevant(clear(newTextDef({ layout })))).toBeFalsy()
    const propsAdvanced = { [keysPropsAdvanced.applicable]: [{ expression: 'true' }] }
    expect(isHiddenWhenNotRelevant(clear(newTextDef({ layout, propsAdvanced })))).toBe(true)
  })

  it('clears defaultValueEvaluatedOneTime only when there are no default values', () => {
    const evaluatedOneTime = { [keysPropsAdvanced.defaultValueEvaluatedOneTime]: true }
    expect(NodeDef.isDefaultValueEvaluatedOneTime(clear(newTextDef({ propsAdvanced: evaluatedOneTime })))).toBe(false)
    const propsAdvanced = { ...evaluatedOneTime, [keysPropsAdvanced.defaultValues]: [{ expression: '1' }] }
    expect(NodeDef.isDefaultValueEvaluatedOneTime(clear(newTextDef({ propsAdvanced })))).toBe(true)
  })
})
