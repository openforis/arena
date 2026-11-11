// "data flow" motif inspired by the Arena logo: curved streams of data turning into a grid of values
const viewBoxWidth = 1280
const viewBoxHeight = 800

const flows = Array.from({ length: 7 }, (_, index) => {
  const yStart = 120 + index * 95
  const yEnd = 300 + index * 38
  return {
    key: `flow_${index}`,
    d: `M-50 ${yStart} C 350 ${yStart}, 450 ${yEnd}, 820 ${yEnd}`,
    opacity: 0.1 + (index % 3) * 0.05,
    width: 14 - index,
  }
})

const cells = Array.from({ length: 7 * 6 }, (_, index) => {
  const row = Math.floor(index / 6)
  const col = index % 6
  return {
    key: `cell_${index}`,
    x: 860 + col * 44,
    y: 288 + row * 38,
    opacity: ((row * 7 + col * 3) % 5) / 18 + 0.06,
  }
})

/**
 * Decorative background of the guest views.
 *
 * @returns {React.ReactElement} The background SVG.
 */
export const GuestBackground = () => (
  <svg
    className="guest__background"
    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    {flows.map(({ key, d, opacity, width }) => (
      <path key={key} className="guest__background-flow" d={d} strokeOpacity={opacity} strokeWidth={width} />
    ))}
    {cells.map(({ key, x, y, opacity }) => (
      <rect
        key={key}
        className="guest__background-cell"
        x={x}
        y={y}
        width={32}
        height={26}
        rx={4}
        fillOpacity={opacity}
      />
    ))}
  </svg>
)
