import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

const DateEditor = ({ date, onChange }) => {
  const [year, month, day] = R.pipe(R.defaultTo('--'), R.split('-'))(date)

  const yearRef = useRef(null)
  const monthRef = useRef(null)
  const dayRef = useRef(null)

  const onChangeDate = () => onChange(`${yearRef.current.value}-${monthRef.current.value}-${dayRef.current.value}`)

  return (
    <span className="date">
      <input type="text" ref={yearRef} size="4" maxLength="4" value={year} onChange={onChangeDate} />
      -
      <input type="text" ref={monthRef} size="2" maxLength="2" value={month} onChange={onChangeDate} />
      -
      <input type="text" ref={dayRef} size="2" maxLength="2" value={day} onChange={onChangeDate} />
    </span>
  )
}

DateEditor.propTypes = {
  date: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

DateEditor.defaultProps = {
  date: null,
}

const DateContainer = ({ date, keyLabel, readOnly, onChange }) => {
  const i18n = useI18n()

  return (
    <div className="date-container">
      <span className="date-label">{i18n.t(keyLabel)}</span>
      {readOnly ? <span className="date">{date}</span> : <DateEditor date={date} onChange={onChange} />}
    </div>
  )
}

DateContainer.propTypes = {
  date: PropTypes.string,
  keyLabel: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}

DateContainer.defaultProps = {
  date: null,
}

export default DateContainer
