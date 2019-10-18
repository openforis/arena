import React from 'react'

const TaxaTableRow = props => {

  const { row, idx, offset, vernacularLanguageCodes } = props

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{row.code}</div>
      <div>{row.family}</div>
      <div>{row.genus}</div>
      <div>{row.scientificName}</div>
      {
        vernacularLanguageCodes.map(lang =>
          <div key={`vernacular_name_${row.uuid}_${lang}`}>
            {row[lang]}
          </div>
        )
      }
    </>
  )
}

export default TaxaTableRow