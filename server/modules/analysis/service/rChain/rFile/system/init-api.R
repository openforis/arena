arena.prepareQueryParams = function(query) {
  actualQuery <- list(language = arena.preferredLanguage, token = arena.token)
  if (!is.null(query)) {
    actualQuery <- c(actualQuery, query)
  }
  return(actualQuery)
}

arena.parseResponse = function(resp) {
  resp <- httr::content(resp, as = "text")
  respJson = jsonlite::fromJSON(resp)
  
  # Check whether response contains error
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

arena.get = function(url, query = NULL) {
  resp <- httr::GET(arena.getApiUrl(url), query = arena.prepareQueryParams(query))
  return(arena.parseResponse(resp))
}

arena.getToFile = function (url, query = NULL, file) {
  httr::GET(arena.getApiUrl(url), query = arena.prepareQueryParams(query), write_disk(file))
}

arena.getCSV = function (url, query = NULL) {
  tmp <- tempfile()
  arena.getToFile(url, query, file = tmp)
  if (file.info(tmp)$size > 0) {
    content <- suppressWarnings(read.csv(tmp))
  } else {
    content <- NULL
  }
  rm(tmp)
  return(content)
}

arena.post = function(url, body) {
  resp <- httr::POST(arena.getApiUrl(url), body = arena.prepareQueryParams(body))
  return(arena.parseResponse(resp))
}

arena.put = function(url, body) {
  resp <- httr::PUT(arena.getApiUrl(url), body = arena.prepareQueryParams(body))
  return(arena.parseResponse(resp))
}

arena.putFile = function(url, filePath) {
  return(
    arena.put(url, body = list('file' = httr::upload_file(filePath)))
  )
}

arena.delete = function(url, body) {
  resp <- httr::DELETE(arena.getApiUrl(url), body = arena.prepareQueryParams(body))
  return(arena.parseResponse(resp))
}

arena.waitForJobToComplete = function(job) {
  if (is.null(job)) {
    stop("Error: job not started properly")
  }
  pb = txtProgressBar(min = 0, max = 100)
  while (!is.null(job) && !job$ended) {
    setTxtProgressBar(pb, job$progressPercent)
    Sys.sleep(15)
    job <- arena.get('/jobs/active')
  }
  close(pb)
  if (is.null(job)) {
    stop("Job completed but state is unknown")
  }
  if (job$succeeded) {
    return(TRUE)
  }
  if (job$failed) {
    stop("Error: job failed.")
  }
  return(FALSE)
}


arena.login = function(tentative) {
  if (missing(tentative)) {
    tentative <- 1
  }
  if (tentative > 1) {
    enterEmailMessage <- "Invalid email or password specified, try again!\r\nUsername (email):"
  } else {
    enterEmailMessage <- "Username (email):"
  }
  user <- rstudioapi::showPrompt(title = "Enter your username (email)", message = enterEmailMessage)
  
  if (is.null(user)) return(FALSE)
  
  user <- trimws(tolower(user))

  password <- rstudioapi::askForPassword(prompt = "Enter your password:")
  if (is.null(password)) return(FALSE)

  password <- trimws(password)

  resp <- httr::POST(
    paste0(arena.host, 'auth/login'),
    body = list(email = user, password = password)
  )
  respParsed <- arena.parseResponse(resp)
  
  if ("message" %in% names(respParsed) && (
    (respParsed$message == 'validationErrors.user.userNotFound') || 
    (respParsed$message == 'validationErrors.user.emailInvalid') || 
    (respParsed$message == 'Missing credentials')
    )) 
  {
    if (tentative < 3) {
      print('*** Invalid email or password specified, try again')
      return(arena.login(tentative + 1))
    } else if (tentative >= 3) {
      print(paste("*** Login failed:", respParsed$message, sep = ' '))
      return(FALSE)
    }
  } else {
    print(paste('*** User', user, 'successfully logged in', sep = ' '))
    return(TRUE)
  }
}
