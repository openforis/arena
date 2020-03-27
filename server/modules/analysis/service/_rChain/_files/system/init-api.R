arena.parseResponse = function (resp) {
  respParsed <- httr::content(resp, as="parsed")
  if("status" %in% names(respParsed) && respParsed$status == 'error'){
    stop( respParsed$key )
  }
  return( respParsed )
}

arena.getApiUrl = function(url){
  apiUrl <- paste(arena.host, 'api/', url, sep = '')
  return( apiUrl )
}

arena.get = function(url){
  resp <- httr::GET(arena.getApiUrl(url))
  return( arena.parseResponse(resp) )
}

arena.post = function(url, params){
  resp <- httr::POST(arena.getApiUrl(url), params)
  return( arena.parseResponse(resp) )
}

arena.login = function(tentative){
  if (missing(tentative)) {
    tentative <- 1
  }
  print('TYPE YOUR EMAIL')
  user <- readLines(stdin(), 1)
  print('TYPE YOUR PASSWORD')
  password <- readLines(stdin(), 1)
  resp <- httr::POST(
    paste(arena.host, 'auth/login', sep = ''), 
    body = list(email=user, password=password)
  )
  respParsed <- arena.parseResponse(resp)
  
  if("message" %in% names(respParsed) && respParsed$message == 'validationErrors.user.userNotFound'){
    if (tentative < 3) {
      print('Invalid email or password specified, try again')
      arena.login(tentative + 1)
    } else {
      stop( respParsed$message )
    }
  } else {
    print(paste('User', user, 'succesfully logged in', sep = ' '))
  }
}
