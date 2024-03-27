import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import { interpolatePath as d3interpolatePath } from 'd3-interpolate-path'
import * as R from 'ramda'

const DataPath = (props) => {
  const { counts, from, to, chartProps } = props
  const { xScale, yScale, transitionDuration } = chartProps
  const elementRef = useRef(null)

  const getPath = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.count))
    .curve(d3.curveMonotoneX)

  const getEmptyPath = () =>
    getPath([
      { date: from, count: 0 },
      { date: to, count: 0 },
    ])

  const interpolatePath = (previous, current) =>
    d3
      .select(elementRef.current)
      .transition()
      .ease(d3.easePolyOut)
      .duration(transitionDuration)
      .attrTween('d', () => d3interpolatePath(previous, current))

  useEffect(() => {
    d3.select(elementRef.current).attr('d', getEmptyPath())
  }, [])

  useEffect(() => {
    const dataEmpty = R.isEmpty(counts)
    const previous = elementRef.current.getAttribute('d')
    const current = dataEmpty ? getEmptyPath() : getPath(counts)
    interpolatePath(previous, current).style('opacity', dataEmpty ? 0 : 1)
  }, [chartProps])

  return <path className="data-path" style={{ opacity: 0 }} ref={elementRef} />
}

DataPath.propTypes = {
  counts: PropTypes.array.isRequired,
  chartProps: PropTypes.object.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
}

export default DataPath
