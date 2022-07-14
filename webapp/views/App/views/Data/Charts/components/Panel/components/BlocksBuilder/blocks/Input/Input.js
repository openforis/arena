import React, { useCallback, useMemo, useState } from 'react'

import Select, { components, MultiValueGenericProps } from 'react-select'
import './Input.scss'
import { Popover } from 'react-tiny-popover'

const icons = {
  quantitative: <span className="icon-left node_def__icon">1.23</span>,
  nominal: (
    <span className="icon-left display-flex">
      {[0, 1, 2].map((i) => (
        <span key={i} className="icon icon-text-color" style={{ margin: '0 -3px' }} />
      ))}
    </span>
  ),
  temporal: <span className="icon icon-clock icon-left" />,
}

const CustomOption = (props) => {
  const { data } = props

  return (
    <components.Option {...props}>
      <div className="option">
        {data.label}
        {icons[data.type]}
      </div>
    </components.Option>
  )
}

const CustomMultiValueContainer = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { data, block, dimensions } = props
  console.log(props)

  return (
    <Popover
      padding={8}
      isOpen={isPopoverOpen}
      onClickOutside={() => setIsPopoverOpen(false)}
      positions={['right', 'top', 'left', 'bottom']}
      align={'center'}
      content={
        <div className="custom-option-modal-container">
          <div className="custom-option-modal-header">
            <p>Hi! I'm popover content.</p>
          </div>
          <div className="custom-option-modal-blocks">
            <InputBlock dimensions={dimensions} block={block} />
          </div>
          <div className="custom-option-modal-actions">
            <button onClick={() => setIsPopoverOpen(false)}></button>
            <button onClick={() => console.log('aa')}>{block.type}edit</button>
          </div>
        </div>
      }
    >
      <div
        className="option multi-option-with-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          console.log(e)
          e.stopPropagation()
          e.preventDefault()
          console.log(e)
          setIsPopoverOpen(!isPopoverOpen)
        }}
      >
        {data.label}
        {icons[data.type]}
      </div>
    </Popover>
  )
}

const InputBlock = ({ dimensions, block }) => {
  const { title, subtitle, id, isMulti } = block

  const options = useMemo(() => block.options || dimensions, [dimensions, block])
  const flatOptions = useMemo(() => block.options || options.flatMap((d) => d.options), [options, block])

  const handleChange = useCallback((optionsSelected) => {
    console.log(optionsSelected)
    let option = null
    if (isMulti) {
      const [_option] = optionsSelected
      option = _option
    }
    option = optionsSelected

    //block?.onUpdate({ spec, onUpdateSpec })({ option })
  }, [])
  const renderCustomMultiValueContainer = useCallback(
    (_props) => {
      return <CustomMultiValueContainer {..._props} block={block} dimensions={dimensions} />
    },
    [block]
  )

  return (
    <div className="block block-input">
      <span className="block__title">{title}</span>
      <span className="block__subtitle">{subtitle}</span>

      <Select
        components={{ Option: CustomOption, MultiValueContainer: renderCustomMultiValueContainer }}
        isMulti={isMulti}
        name={id}
        options={options}
        className="basic-multi-select"
        classNamePrefix="select"
        onChange={handleChange}
      />
      <span>{flatOptions.length} Option(s)</span>
    </div>
  )
}

export default InputBlock
