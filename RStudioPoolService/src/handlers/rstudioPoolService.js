exports.handler = async (a) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({ status: a }),
  }
  return response
}
