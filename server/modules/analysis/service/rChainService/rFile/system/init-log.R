arena.log <- function(step, msg, level) {
  row1 <- paste(Sys.time(), step, sep = "     step : ")
  cat(row1)

  row2 <- paste0("\n", level)
  row2 <- paste0(row2, ':')
  row2 <- paste(row2, msg, sep = " ")
  row2 <- paste(row2, '\n', sep = " ")
  cat(row2)
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
