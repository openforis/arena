const { v4: uuidv4 } = require('uuid')

const isUuid = (value) =>
  value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

module.exports = {
  uuidv4,
  isUuid,
}
