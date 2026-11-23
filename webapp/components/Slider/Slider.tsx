type SliderProps = {
  className?: string
  id: string
  max?: number
  min?: number
  name?: string
  onChange?: (...args: any[]) => any
  onMouseDown?: (...args: any[]) => any
  onMouseUp?: (...args: any[]) => any
  options?: {
    value: string
    label?: string
  }[]
  step?: number
  value?: number
}

export const Slider = (props: SliderProps) => {
  const { className, id, max, min, name, onChange, onMouseDown, onMouseUp, options, step, value } = props

  const listId = options ? `${id}-dl` : null

  return (
    <>
      <input
        className={className}
        id="map-layer-slider"
        list={listId}
        min={min}
        max={max}
        name={name}
        onChange={onChange}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        step={step}
        type="range"
        value={value}
      />

      {options && (
        <datalist id={listId}>
          {options.map(({ value, label }) => (
            <option key={value} value={value} label={label} />
          ))}
        </datalist>
      )}
    </>
  )
}
