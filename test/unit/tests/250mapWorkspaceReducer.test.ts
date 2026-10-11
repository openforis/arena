import {
  initialMapWorkspaceState,
  mapWorkspaceReducer,
} from '@webapp/components/MapContainer/workspace/mapWorkspaceReducer'
import type { MapWorkspaceAction } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'

const reduce = (actions: MapWorkspaceAction[], railTab: 'layers' | null = null) =>
  actions.reduce(mapWorkspaceReducer, initialMapWorkspaceState(railTab))

describe('Map workspace reducer (250)', () => {
  test('initial state opens the given rail tab, no tool, no dialog', () => {
    expect(initialMapWorkspaceState('layers')).toEqual({ railTab: 'layers', activeTool: null, dialog: null })
    expect(initialMapWorkspaceState(null)).toEqual({ railTab: null, activeTool: null, dialog: null })
  })

  test('toggleRailTab opens a tab, switches to another one, and closes the open one', () => {
    expect(reduce([{ type: 'toggleRailTab', tab: 'legend' }]).railTab).toBe('legend')
    expect(reduce([{ type: 'toggleRailTab', tab: 'legend' }], 'layers').railTab).toBe('legend')
    expect(reduce([{ type: 'toggleRailTab', tab: 'layers' }], 'layers').railTab).toBeNull()
  })

  test('openRailTab never closes the rail', () => {
    const state = reduce([{ type: 'openRailTab', tab: 'scenes' }])
    expect(state.railTab).toBe('scenes')
    expect(mapWorkspaceReducer(state, { type: 'openRailTab', tab: 'scenes' })).toBe(state)
  })

  test('closeRail closes the rail and returns the same state when it is closed', () => {
    expect(reduce([{ type: 'closeRail' }], 'layers').railTab).toBeNull()
    const closed = initialMapWorkspaceState(null)
    expect(mapWorkspaceReducer(closed, { type: 'closeRail' })).toBe(closed)
  })

  test('toggleTool starts a tool, switches to another one, and ends the active one', () => {
    expect(reduce([{ type: 'toggleTool', tool: 'measureDistance' }]).activeTool).toBe('measureDistance')
    expect(
      reduce([
        { type: 'toggleTool', tool: 'measureDistance' },
        { type: 'toggleTool', tool: 'measureArea' },
      ]).activeTool
    ).toBe('measureArea')
    expect(
      reduce([
        { type: 'toggleTool', tool: 'measureDistance' },
        { type: 'toggleTool', tool: 'measureDistance' },
      ]).activeTool
    ).toBeNull()
  })

  test('startTool keeps an active tool active', () => {
    const state = reduce([{ type: 'startTool', tool: 'measureDistance' }])
    expect(state.activeTool).toBe('measureDistance')
    expect(mapWorkspaceReducer(state, { type: 'startTool', tool: 'measureDistance' })).toBe(state)
  })

  test('endTool and closeDialog return the same state when nothing is active', () => {
    const state = initialMapWorkspaceState('layers')
    expect(mapWorkspaceReducer(state, { type: 'endTool' })).toBe(state)
    expect(mapWorkspaceReducer(state, { type: 'closeDialog' })).toBe(state)
  })

  test('opening a dialog keeps the active tool and the rail tab', () => {
    const state = reduce(
      [
        { type: 'startTool', tool: 'measureArea' },
        { type: 'openDialog', dialog: 'screenshot' },
      ],
      'layers'
    )
    expect(state).toEqual({ railTab: 'layers', activeTool: 'measureArea', dialog: 'screenshot' })
    expect(mapWorkspaceReducer(state, { type: 'closeDialog' }).dialog).toBeNull()
  })

  test('an unknown action returns the same state', () => {
    const state = initialMapWorkspaceState(null)
    expect(mapWorkspaceReducer(state, { type: 'unknown' } as unknown as MapWorkspaceAction)).toBe(state)
  })
})
