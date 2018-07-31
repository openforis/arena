const selectDate = field => `to_char(${field},'YYYY-MM-DD"T"HH24:MI:ssZ') as ${field}`

module.exports = {
  selectDate
}