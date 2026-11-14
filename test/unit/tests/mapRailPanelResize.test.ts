import {
  clampRailPanelWidth,
  RAIL_PANEL_MAX_WIDTH,
  RAIL_PANEL_MIN_WIDTH,
} from '@webapp/components/MapContainer/workspace/rail/useRailPanelResize'

describe('map rail panel resize', () => {
  test('keeps the width between the min and the max', () => {
    expect(clampRailPanelWidth(50)).toBe(RAIL_PANEL_MIN_WIDTH)
    expect(clampRailPanelWidth(10000)).toBe(RAIL_PANEL_MAX_WIDTH)
    expect(clampRailPanelWidth(300.4)).toBe(300)
  })
})
