const {validateNode} = require('../server/record/recordExprParser')

const main = async () => {

  const node = {id: 2, value: 12, name: 'tree'}

  const result = await validateNode(node)

  console.log('========== RESULT')
  console.log(result)
}

main()
