import { buildCssVarMap, defaultTokens } from '@webapp/theme/applyCssVars'

describe('buildCssVarMap', () => {
  it('exposes default blue family from tokens', () => {
    const map = buildCssVarMap({ tokens: defaultTokens })
    expect(map['--blue']).toBe(defaultTokens.colors.blue)
    expect(map['--fontFamily']).toBe(defaultTokens.typography.fontFamily)
  })

  it('overrides blue with survey primary when provided', () => {
    const map = buildCssVarMap({ tokens: defaultTokens, primaryColor: '#112233' })
    expect(map['--blue']).toBe('#112233')
    expect(map['--colorTextPrimary']).toBeTruthy()
  })
})
