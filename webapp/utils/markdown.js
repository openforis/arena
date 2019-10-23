import React from 'react'
import Remarkable from 'remarkable'

// Usage: <Markdown source={msg}  />
// Props:
// - source: markdown text to render
// - options: Remarkable options (optional)
// - container: the container element to use (defaults to 'div')
export default class Markdown extends React.Component {
  render() {
    const Container = this.props.container;
    const output = this.renderMarkdown(this.props.source)
    if (this.props.options.html)
        return <Container dangerouslySetInnerHTML={{ __html: output}} />
    else
        return <Container>{output}</Container>
 }

  renderMarkdown(source) {
    if (this.options !== this.props.options) {
      this.md = new Remarkable(this.props.options)
      this.options = this.props.options
    }
    return this.md.render(source)
  }
}

Markdown.defaultProps = {
  container: 'div',
  options: {},
}
