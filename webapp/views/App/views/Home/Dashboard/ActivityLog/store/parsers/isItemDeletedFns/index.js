import isItemDeletedFnsAnalysis from './analysis'
import isItemDeletedFnsCategory from './category'
import isItemDeletedFnsNode from './node'
import isItemDeletedFnsRecord from './record'
import isItemDeletedFnsSurvey from './survey'
import isItemDeletedFnsTaxonomy from './taxonomy'
import isItemDeletedFnsUser from './user'

export default {
  ...isItemDeletedFnsSurvey,
  ...isItemDeletedFnsCategory,
  ...isItemDeletedFnsTaxonomy,
  ...isItemDeletedFnsRecord,
  ...isItemDeletedFnsNode,
  ...isItemDeletedFnsUser,
  ...isItemDeletedFnsAnalysis,
}
