import * as d3 from 'd3'

export default class Tree {
  constructor (container) {
    this.container = container

    this.container.attr('id', `tree_${new Date().getTime()}`)
  }

  // hide () {
  //   this.container.hide()
  // }

  // show () {
  //   this.container.fadeIn()
  // }

  init (node) {
    this.container.empty()

    const width = this.container.width()
    const height = this.container.height()

    const m = [20, 120, 20, 120]
    const w = width - m[1] - m[3]
    const h = height - m[0] - m[2]

    let i = 0

    const tree = d3
      .layout
      .tree()
      .size([h, w])

    const diagonal = d3.svg.diagonal().projection(d => [d.y, d.x])

    const vis = d3
      .select(`#{this.container.attr('id')}`)
      .append('svg')
      .attr('class', 'tree-layout')
      .attr('width', w + m[1] + m[3])
      .attr('height', h + m[0] + m[2])
      .append('svg:g')
      .attr('transform', `translate(${m[3]}, ${m[0]})`)

    const update = source => {
      const duration = d3.event && d3.event.altKey ? 5000 : 500

      // Compute the new tree layout.
      const nodes = tree.nodes(root).reverse()

      // Normalize for fixed-depth.
      nodes.forEach(d => { d.y = d.depth * 180 })

      // Update the nodes…
      const node = vis.selectAll('g.node').data(nodes, d => d.id || (d.id = ++i))

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0}, ${source.x0})`)
        .on('click', d => {
          toggle(d)
          update(d)
        })

      const getNodeClass = d => (d.children && d.children.length > 0) || (d._children && d._children.length > 0) ? 'node' : 'leaf'

      nodeEnter
        .append('circle')
        .attr('r', '6')
        .attr('class', getNodeClass)

      nodeEnter.append('svg:text')
        .attr('x', d => d.children || d._children ? -10 : 10)
        .attr('dy', '.35em')
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => d.name)

      // Transition nodes to their new position.
      const nodeUpdate = node.transition().duration(duration).attr('transform', d => `translate(${d.y}, ${d.x})`)

      nodeUpdate
        .select('circle')
        .attr('r', 8)
        .attr('class', getNodeClass)

      nodeUpdate
        .select('text')
        .attr('class', getNodeClass)

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit()
        .transition()
        .duration(duration)
        .ease('out')
        .attr('transform', d => `translate(${source.y}, ${source.x})`)
        .remove()

      nodeExit.select('circle').attr('r', 1e-6)

      nodeExit.select('text').style('fill-opacity', 1e-6)

      // Update the links…
      const link = vis.selectAll('path.link').data(tree.links(nodes), d => d.target.id)

      // Enter any new links at the parent's previous position.
      link.enter()
        .insert('svg:path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
          const o = {
            x: source.x0,
            y: source.y0
          }
          return diagonal({
            source: o,
            target: o
          })
        })
        .transition()
        .duration(duration)
        .attr('d', diagonal)

      // Transition links to their new position.
      link.transition().duration(duration).attr('d', diagonal)

      // Transition exiting nodes to the parent's new position.
      link.exit().transition().duration(duration).attr('d', d => {
        const o = {
          x: source.x,
          y: source.y
        }
        return diagonal({
          source: o,
          target: o
        })
      }).remove()

      // Stash the old positions for transition.
      nodes.forEach(d => {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    // Toggle children.
    const toggle = d => {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }
    }

    const root = node
    root.x0 = h / 2
    root.y0 = 0

    const toggleAll = d => {
      if (d.children) {
        d.children.forEach(toggleAll)
        toggle(d)
      }
    }

    root.children.forEach(toggleAll)

    update(root)
  }
}