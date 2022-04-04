# sqldf options.
# driver is set to SQLLite in order to read from dataframe
# https://code.google.com/p/sqldf/#Troubleshooting
options(
  gsubfn.engine = "R",
  sqldf.driver = "SQLite"
)

#**
#* Check if the execution of a task returned an error
#**
checkError <- function(e) {
  if (inherits(e, "try-error") || inherits(e, "simpleError")) {
    print("ARENA-ERROR", quote = F)
    stop(e)
  }
}

#**
#* Extracts the content of a file and returns it as an SQL quoted string
#**
arena.getQuotedFileContent <- function(filename) {
  # TODO
  # newLinePlaceHolder <- 'ARENA_NEW_LINE_PLACEHOLDER'
  #
  # filePath <- paste(scriptDir, filename, sep = .Platform$file.sep)
  #
  # c <- file(filePath, encoding = "UTF-8")
  # fileContent <- paste(readLines(c, warn = F), collapse = newLinePlaceHolder)
  # close(c)
  #
  # fileContent <- dbQuoteString(conn = connection, x = fileContent)
  # fileContent <- gsub(newLinePlaceHolder, '\n', fileContent)
  #
  # return(fileContent)
}

# processing chain starting time
arena.startTime <- Sys.time()

# processing chain summary info
chain_summary_json <- paste(getwd(), 'chain_summary.json', sep = .Platform$file.sep)
if ( file.exists( chain_summary_json ) ) {
  arena.chainSummary <- jsonlite::fromJSON( chain_summary_json )
}
rm( chain_summary_json )
