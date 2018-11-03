const {validateNode} = require('../server/record/recordExprParser')

const main = async () => {

  const result = await validateNode()

  console.log('========== RESULT')
  console.log(result)
}

main()
