const nodeDefValidationType = {
  comparison: 'comparison', //only for Code, Text, Integer, Decimal, Date, Time
  custom: 'custom',
  distance: 'distance', //only for Coordinate
  pattern: 'pattern', //only for Text
}

const nodeDefValidation = {
  type: null, //nodeDefValidationType

  condition: null, //boolean expression

  //=== comparison
  min: null, //numeric expression
  max: null, //numeric expression
  minInclusive: null, //numeric expression
  maxInclusive: null, //numeric expression

  //=== distance
  maxDistance: null, //numeric expression
  distanceSource: null, //coordinate expression

  //=== pattern
  regex: null, //regular expression

  //=== custom
  expression: null, //boolean expression

}