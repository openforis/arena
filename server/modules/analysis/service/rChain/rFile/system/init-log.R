arena.log <- function(step, msg, level) {
  row <- paste(
    paste0('[', Sys.time(), ']'),
    paste0('[', level, ']'),
    step
  )
  #append message
  row <- paste(row, msg, sep = ' - ')
  cat(paste(row, '\n'))
}

arena.info <- function(step, msg) {
  arena.log(step, msg, "INFO");
}

arena.warn <- function(step, msg) {
  arena.log(step, msg, "WARN");
}

arena.error <- function(step, msg) {
  arena.log(step, msg, "ERROR");
}

arena.debug <- function(step, msg) {
  arena.log(step, msg, "DEBUG");
}
