import React from 'react'

class UploadButton extends React.Component {

  constructor (props) {
    super(props)

    this.fileInput = React.createRef()
  }

  render () {
    const {disabled, label, onChange, showLabel} = this.props

    return <React.Fragment>
      <input
        ref={this.fileInput}
        type="file"
        style={{display: 'none'}}
        onChange={() => onChange(this.fileInput.current.files)}/>

      <button className="btn btn-of btn-upload"
              aria-disabled={disabled}
              onClick={() => {
                // first reset current value, then trigger click event
                this.fileInput.current.value = ''
                this.fileInput.current.dispatchEvent(new MouseEvent('click'))
              }}>
        <span className={`icon icon-upload2 icon-16px${showLabel ? ' icon-left' : ''}`}/>
        {showLabel && label}
      </button>
    </React.Fragment>
  }

}

UploadButton.defaultProps = {
  disabled: false,
  label: 'Upload',
  onChange: null,
  showLabel: true,
}

export default UploadButton