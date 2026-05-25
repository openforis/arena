arena.getApiUrl = function(url) {
  apiUrl <- paste0(arena.host, 'api', url)
  return(apiUrl)
}

arena.getCookie = function(resp, cookieName) {
  respCookies <- httr::cookies(resp)
  cookie <- respCookies[respCookies$name == cookieName, ]
  return(cookie$value)
}

arena.prepareQueryParams = function(query) {
  actualQuery <- list(language = arena.preferredLanguage, token = arena.token)
  if (!is.null(query)) {
    actualQuery <- c(actualQuery, query)
  }
  return(actualQuery)
}

arena.createHeadersConfig <- function() {
  return(add_headers(
    Authorization = paste("Bearer", .arena.authToken)
  ))
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

arena.refreshAuthTokens = function() {
  resp <- httr::POST(paste0(arena.host, "auth/token/refresh"), config = set_cookies(refreshToken = .arena.authRefreshToken))
  if (resp$status == 200) {
    respParsed <- arena.parseResponse(resp)

    .arena.authToken <<- respParsed$authToken
    .arena.authRefreshToken <<- arena.getCookie(resp, 'refreshToken')  
    return(TRUE)
  }
  return(FALSE)
}

arena.handleUnauthorizedAndRetry = function(requestFn) {
  resp <- requestFn()

  if (resp$status != 401) {
    return(resp)
  }

  if (arena.refreshAuthTokens()) {
    resp <- requestFn()
    if (resp$status != 401) {
      return(resp)
    }
  }

  print('*** Session expired or unauthorized request, login required')
  if (!arena.login()) {
    return(resp)
  }

  return(requestFn())
}

arena._getInternal = function(url, query = NULL) {
  resp <- httr::GET(arena.getApiUrl(url), query = arena.prepareQueryParams(query), arena.createHeadersConfig())
  return(resp)
}

arena.get = function(url, query = NULL) {
  resp <- arena.handleUnauthorizedAndRetry(function() arena._getInternal(url, query))
  return(arena.parseResponse(resp))
}

arena._getToFileInternal = function (url, query = NULL, file) {
  resp <- httr::GET(
    url = arena.getApiUrl(url), 
    query = arena.prepareQueryParams(query), 
    write_disk(file, overwrite = TRUE),
    arena.createHeadersConfig()
  )
  return(resp)
 }

arena.getToFile = function (url, query = NULL, file) {
  resp <- arena.handleUnauthorizedAndRetry(function() arena._getToFileInternal(url, query, file))
  return(resp)
}

arena.getCSV = function (url, query = NULL) {
  tmpFile <- tempfile()
  arena.getToFile(url, query, file = tmpFile)
  if (file.info(tmpFile)$size > 0) {
    content <- suppressWarnings(read.csv(tmpFile))
  } else {
    content <- NULL
  }
  rm(tmpFile)
  return(content)
}

arena._postInternal = function(url, body) {
  resp <- httr::POST(arena.getApiUrl(url), body = arena.prepareQueryParams(body), arena.createHeadersConfig())
  return(resp)
}

arena.post = function(url, body) {
  resp <- arena.handleUnauthorizedAndRetry(function() arena._postInternal(url, body))
  return(arena.parseResponse(resp))
}

arena._putInternal = function(url, body) {
  resp <- httr::PUT(arena.getApiUrl(url), body = arena.prepareQueryParams(body), arena.createHeadersConfig())
  return(resp)
}

arena.put = function(url, body) {
  resp <- arena.handleUnauthorizedAndRetry(function() arena._putInternal(url, body))
  return(arena.parseResponse(resp))
}

arena.putFile = function(url, filePath) {
  return(
    arena.put(url, body = list('file' = httr::upload_file(filePath)))
  )
}

arena._deleteInternal = function(url, body) {
  resp <- httr::DELETE(arena.getApiUrl(url), body = arena.prepareQueryParams(body), arena.createHeadersConfig())
  return(resp)
}

arena.delete = function(url, body) {
  resp <- arena.handleUnauthorizedAndRetry(function() arena._deleteInternal(url, body))
  return(arena.parseResponse(resp))
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
  username <- rstudioapi::showPrompt(title = "Enter your username (email)", message = enterEmailMessage)
  
  if (is.null(username)) return(FALSE)
  
  username <- trimws(tolower(username))
  
  password <- rstudioapi::askForPassword(prompt = "Enter your password:")
  if (is.null(password)) return(FALSE)
  
  password <- trimws(password)

  loginRequest <- function(twoFactorToken = NULL) {
    body <- list(email = username, password = password)
    if (!is.null(twoFactorToken) && nchar(twoFactorToken) > 0) {
      body$twoFactorToken <- twoFactorToken
    }
    httr::POST(paste0(arena.host, 'auth/login'), body = body)
  }

  promptTwoFactorToken <- function(twoFactorTentative = 1) {
    if (twoFactorTentative > 1) {
      message <- "Invalid verification code specified, try again!"
    } else {
      message <- "Enter your verification code:"
    }
    token <- rstudioapi::askForPassword(prompt = message)
    if (is.null(token)) {
      return(NULL)
    }
    trimws(token)
  }

  getLoginResponseJson <- function(resp) {
    respText <- httr::content(resp, as = "text")
    return(tryCatch(jsonlite::fromJSON(respText), error = function(e) list()))
  }
  
  resp <- loginRequest()
  respJson <- getLoginResponseJson(resp)

  if (isTRUE(respJson$twoFactorRequired)) {
    twoFactorTentative <- 1
    repeat {
      twoFactorToken <- promptTwoFactorToken(twoFactorTentative)
      if (is.null(twoFactorToken) || nchar(twoFactorToken) == 0) {
        return(FALSE)
      }

      resp <- loginRequest(twoFactorToken)
      respJson <- getLoginResponseJson(resp)
      if (!isTRUE(respJson$twoFactorRequired)) {
        break
      }

      if (twoFactorTentative >= 3) {
        print('*** Login failed: invalid verification code')
        return(FALSE)
      }
      twoFactorTentative <- twoFactorTentative + 1
    }
  }

  respParsed <- arena.parseResponse(resp)
  loginSucceeded <- !is.null(respParsed$authToken) && nchar(respParsed$authToken) > 0
  if (!loginSucceeded && !is.null(respParsed$user)) {
    loginSucceeded <- TRUE
  }

  if (loginSucceeded) {
    .arena.authToken <<- respParsed$authToken
    .arena.authRefreshToken <<- arena.getCookie(resp, 'refreshToken')
    print(paste('*** User', username, 'successfully logged in', sep = ' '))
    return(TRUE)
  }

  if ("message" %in% names(respParsed) && (
    (respParsed$message == 'validationErrors:user.userNotFound') || 
    (respParsed$message == 'validationErrors:user.emailInvalid') || 
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
    failureMessage <- if ("message" %in% names(respParsed) && !is.na(respParsed$message)) {
      respParsed$message
    } else {
      'Login failed'
    }
    print(paste("***", failureMessage))
    return(FALSE)
  }
}

arena.waitForJobToComplete = function(job) {
  if (is.null(job)) {
    stop("Error: job not started properly")
  }
  pb <- txtProgressBar(min = 0, max = 100)
  while (!is.null(job) && (job$status == 'pending' || job$status == 'running')) {
    setTxtProgressBar(pb, job$progressPercent)
    Sys.sleep(15)
    job <- arena.get(paste0('/jobs/', job$uuid))
  }
  
  if (!is.null(job)) {
    setTxtProgressBar(pb, 100)
  }
  close(pb)
  if (is.null(job)) {
    stop("Job complete but state is unknown")
  }
  if (job$status == 'succeeded') {
    return(TRUE)
  }
  stop("Error: job failed or canceled")
}
