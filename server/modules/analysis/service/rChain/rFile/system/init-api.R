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

# auth tokens are stored in the global environment, where the chain scripts are sourced
arena.setAuthTokens = function(authToken, authRefreshToken) {
  assign(".arena.authToken", authToken, envir = .GlobalEnv)
  assign(".arena.authRefreshToken", authRefreshToken, envir = .GlobalEnv)
}

arena.refreshAuthTokens = function() {
  resp <- httr::POST(paste0(arena.host, "auth/token/refresh"), config = set_cookies(refreshToken = .arena.authRefreshToken))
  if (resp$status == 200) {
    respParsed <- arena.parseResponse(resp)

    arena.setAuthTokens(respParsed$authToken, arena.getCookie(resp, 'refreshToken'))
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

  message('*** Session expired or unauthorized request, login required')
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

arena._getToFileInternal = function (url, file, query = NULL) {
  resp <- httr::GET(
    url = arena.getApiUrl(url), 
    query = arena.prepareQueryParams(query), 
    write_disk(file, overwrite = TRUE),
    arena.createHeadersConfig()
  )
  return(resp)
 }

arena.getToFile = function (url, file, query = NULL) {
  resp <- arena.handleUnauthorizedAndRetry(function() arena._getToFileInternal(url, file, query))
  return(resp)
}

arena.getCSV = function (url, query = NULL) {
  tmpFile <- tempfile()
  arena.getToFile(url, file = tmpFile, query = query)
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
    arena.put(url, body = list(file = httr::upload_file(filePath)))
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

arena.promptLoginCredentials = function(tentative) {
  enterEmailMessage <- if (tentative > 1) {
    "Invalid email or password specified, try again!\r\nUsername (email):"
  } else {
    "Username (email):"
  }
  username <- rstudioapi::showPrompt(title = "Enter your username (email)", message = enterEmailMessage)
  if (is.null(username)) return(NULL)

  password <- rstudioapi::askForPassword(prompt = "Enter your password:")
  if (is.null(password)) return(NULL)

  return(list(username = trimws(tolower(username)), password = trimws(password)))
}

arena.sendLoginRequest = function(credentials, twoFactorToken = NULL) {
  body <- list(email = credentials$username, password = credentials$password)
  if (!is.null(twoFactorToken) && nchar(twoFactorToken) > 0) {
    body$twoFactorToken <- twoFactorToken
  }
  httr::POST(paste0(arena.host, 'auth/login'), body = body)
}

arena.getLoginResponseJson = function(resp) {
  respText <- httr::content(resp, as = "text")
  return(tryCatch(jsonlite::fromJSON(respText), error = function(e) list()))
}

arena.isTwoFactorRequired = function(resp) {
  return(isTRUE(arena.getLoginResponseJson(resp)$twoFactorRequired))
}

arena.promptTwoFactorToken = function(twoFactorTentative = 1) {
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

# returns the login response, or NULL if the verification is canceled or fails 3 times
arena.loginWithTwoFactorToken = function(credentials) {
  for (twoFactorTentative in 1:3) {
    twoFactorToken <- arena.promptTwoFactorToken(twoFactorTentative)
    if (is.null(twoFactorToken) || nchar(twoFactorToken) == 0) {
      return(NULL)
    }
    resp <- arena.sendLoginRequest(credentials, twoFactorToken)
    if (!arena.isTwoFactorRequired(resp)) {
      return(resp)
    }
  }
  message('*** Login failed: invalid verification code')
  return(NULL)
}

arena.isLoginSucceeded = function(respParsed) {
  hasAuthToken <- !is.null(respParsed$authToken) && nchar(respParsed$authToken) > 0
  return(hasAuthToken || !is.null(respParsed$user))
}

arena.isInvalidCredentialsResponse = function(respParsed) {
  invalidCredentialsMessages <- c('validationErrors:user.userNotFound', 'validationErrors:user.emailInvalid', 'Missing credentials')
  return("message" %in% names(respParsed) && isTRUE(respParsed$message %in% invalidCredentialsMessages))
}

arena.onLoginFailed = function(respParsed, tentative) {
  if (arena.isInvalidCredentialsResponse(respParsed)) {
    if (tentative < 3) {
      message('*** Invalid email or password specified, try again')
      return(arena.login(tentative + 1))
    }
    message(paste("*** Login failed:", respParsed$message, sep = ' '))
    return(FALSE)
  }
  failureMessage <- if ("message" %in% names(respParsed) && !is.na(respParsed$message)) {
    respParsed$message
  } else {
    'Login failed'
  }
  message(paste("***", failureMessage))
  return(FALSE)
}

arena.login = function(tentative = 1) {
  credentials <- arena.promptLoginCredentials(tentative)
  if (is.null(credentials)) return(FALSE)

  resp <- arena.sendLoginRequest(credentials)
  if (arena.isTwoFactorRequired(resp)) {
    resp <- arena.loginWithTwoFactorToken(credentials)
    if (is.null(resp)) return(FALSE)
  }

  respParsed <- arena.parseResponse(resp)
  if (!arena.isLoginSucceeded(respParsed)) {
    return(arena.onLoginFailed(respParsed, tentative))
  }
  arena.setAuthTokens(respParsed$authToken, arena.getCookie(resp, 'refreshToken'))
  message(paste('*** User', credentials$username, 'successfully logged in', sep = ' '))
  return(TRUE)
}

arena.waitForJobToComplete = function(job) {
  if (is.null(job)) {
    stop("Error: job not started properly", call. = FALSE)
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
    stop("Job complete but state is unknown", call. = FALSE)
  }
  if (job$status == 'succeeded') {
    return(TRUE)
  }
  stop("Error: job failed or canceled", call. = FALSE)
}
