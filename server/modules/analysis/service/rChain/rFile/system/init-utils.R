arena.dfColumnsAs = function (df, columns, mutateFunction) {
  return ( df %>% 
    dplyr::mutate(across( all_of( columns), mutateFunction))
  )
}

arena.dfColumnsAsCharacter = function (df, columns) {
  return ( arena.dfColumnsAs(df, columns, as.character) )
}

arena.dfColumnsAsLogical = function (df, columns) {
  return ( arena.dfColumnsAs(df, columns, as.logical) )
}

arena.dfColumnsAsNumeric = function (df, columns) {
  return ( arena.dfColumnsAs(df, columns, as.numeric) )
}
