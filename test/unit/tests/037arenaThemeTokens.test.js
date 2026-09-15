import { buildCssVarMap, defaultTokens } from '@webapp/theme/applyCssVars'

describe('buildCssVarMap', () => {
  it('exposes default blue family from tokens', () => {
    const map = buildCssVarMap({ tokens: defaultTokens })
    expect(map['--blue']).toBe(defaultTokens.colors.blue)
    expect(map['--fontFamily']).toBe(defaultTokens.typography.fontFamily)
  })

  it('overrides blue with survey primary when provided', () => {
    const primaryColor = '#112233'
    const map = buildCssVarMap({ tokens: defaultTokens, primaryColor })
    expect(map['--blue']).toBe(primaryColor)
    expect(map['--colorTextPrimary']).toBe(primaryColor)
    expect(map['--blueDark']).toBe(primaryColor)
    expect(map['--borderColorFocussed']).toBe(primaryColor)
  })
})
