import { interceptDoubleClick } from '@webapp/components/MapContainer/workspace/tools/measure/measureDoubleClick'
import type { DoubleClickTarget } from '@webapp/components/MapContainer/workspace/tools/measure/measureDoubleClick'
import {
  geomanShapeOf,
  measureDrawOptions,
  measureModeOfTool,
  toolOfMeasureMode,
  unitOptionsOf,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureModes'

type Registration = { type: string; listener: unknown; capture: unknown }

/**
 * Creates a fake event target that records its listeners.
 * @returns {{target: DoubleClickTarget, registrations: Registration[]}} The target and its current registrations.
 */
const createTarget = (): { target: DoubleClickTarget; registrations: Registration[] } => {
  const registrations: Registration[] = []
  const target: DoubleClickTarget = {
    addEventListener: (type, listener, capture) => {
      registrations.push({ type, listener, capture })
    },
    removeEventListener: (type, listener, capture) => {
      const index = registrations.findIndex(
        (registration) =>
          registration.type === type && registration.listener === listener && registration.capture === capture
      )
      if (index >= 0) registrations.splice(index, 1)
    },
  }
  return { target, registrations }
}

/**
 * Creates a fake double-click event.
 * @returns {Event} An event whose propagation methods are spies.
 */
const createEvent = (): Event =>
  ({
    type: 'dblclick',
    target: null,
    stopImmediatePropagation: jest.fn(),
    preventDefault: jest.fn(),
  }) as unknown as Event

describe('Map measure modes (263)', () => {
  test('maps tools to modes', () => {
    expect(measureModeOfTool('measureDistance')).toBe('distance')
    expect(measureModeOfTool('measureArea')).toBe('area')
    expect(measureModeOfTool(null)).toBeNull()
  })

  test('maps modes to tools', () => {
    expect(toolOfMeasureMode('distance')).toBe('measureDistance')
    expect(toolOfMeasureMode('area')).toBe('measureArea')
  })

  test('draws lines for distance and polygons for area', () => {
    expect(geomanShapeOf('distance')).toBe('Line')
    expect(geomanShapeOf('area')).toBe('Polygon')
  })

  test('offers the units of each mode', () => {
    expect(unitOptionsOf('distance')).toEqual(['auto', 'm', 'km'])
    expect(unitOptionsOf('area')).toEqual(['auto', 'm2', 'ha', 'km2'])
  })

  test('keeps drawing after each finished measurement, without snapping or Geoman tooltips', () => {
    const options = measureDrawOptions('distance')
    expect(options.continueDrawing).toBe(true)
    expect(options.snappable).toBe(false)
    expect(options.tooltips).toBe(false)
    expect(options.finishOn).toBeNull()
  })

  test('refuses self-intersecting area polygons but allows crossing paths', () => {
    expect(measureDrawOptions('area').allowSelfIntersection).toBe(false)
    expect(measureDrawOptions('distance').allowSelfIntersection).toBe(true)
  })

  test('finished shapes do not capture clicks', () => {
    expect(measureDrawOptions('area').pathOptions.interactive).toBe(false)
  })
})

describe('Map measure double-click guard (263)', () => {
  test('listens to double-clicks in the capture phase', () => {
    const { target, registrations } = createTarget()
    interceptDoubleClick(target, jest.fn())
    expect(registrations).toHaveLength(1)
    expect(registrations[0].type).toBe('dblclick')
    expect(registrations[0].capture).toBe(true)
  })

  test("stops the double-click before the map's own handlers and reports it", () => {
    const { target, registrations } = createTarget()
    const onDoubleClick = jest.fn()
    interceptDoubleClick(target, onDoubleClick)
    const event = createEvent()
    ;(registrations[0].listener as (event: Event) => void)(event)
    expect(event.stopImmediatePropagation).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(onDoubleClick).toHaveBeenCalledWith(event)
  })

  test('release removes the same listener', () => {
    const { target, registrations } = createTarget()
    const release = interceptDoubleClick(target, jest.fn())
    release()
    expect(registrations).toHaveLength(0)
  })
})
