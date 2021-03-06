arena.parseResponse = function(resp) {
  resp <- httr::content(resp, as = "text")
  respJson = jsonlite::fromJSON(resp)

  # Check whether response containts error
  respNames <- names(respJson)
  error <- NA
  if("error" %in% respNames){
    error <- respJson$error
  }
  if("status" %in% respNames && respJson$status == 'error'){
    error <- respJson$params$text
  }
  if (!is.na(error)) {
    stop(error)
  }

  return(respJson)
}


arena.getApiUrl = function(url) {
  apiUrl <- paste0(arena.host, 'api', url)
  return(apiUrl)
}

arena.get = function(url, query) {
  resp <- httr::GET(arena.getApiUrl(url), query = query)
  return(arena.parseResponse(resp))
}

arena.post = function(url, body) {
  resp <- httr::POST(arena.getApiUrl(url), body = body)
  return(arena.parseResponse(resp))
}

arena.put = function(url, body) {
  resp <- httr::PUT(arena.getApiUrl(url), body = body)
  return(arena.parseResponse(resp))
}

arena.putFile = function(url, filePath) {
  return(
    arena.put(url, body = list('file' = httr::upload_file(filePath)))
  )
}

arena.delete = function(url, body) {
  resp <- httr::DELETE(arena.getApiUrl(url), body = body)
  return(arena.parseResponse(resp))
}

arena.login = function(tentative) {
  if (missing(tentative)) {
    tentative <- 1
  }
  print('TYPE YOUR EMAIL')
  user <- readLines(stdin(), 1)
  print('TYPE YOUR PASSWORD')
  password <- readLines(stdin(), 1)
  resp <- httr::POST(
    paste0(arena.host, 'auth/login'),
    body = list(email = user, password = password)
  )
  respParsed <- arena.parseResponse(resp)

  if ("message" %in% names(respParsed) && respParsed$message == 'validationErrors.user.userNotFound') {
    if (tentative < 3) {
      print('Invalid email or password specified, try again')
      arena.login(tentative + 1)
    } else {
      stop(respParsed$message)
    }
  } else {
    print(paste('User', user, 'succesfully logged in', sep = ' '))
  }
}
