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
    message("ARENA-ERROR")
    stop(e)
  }
}

# processing chain starting time
arena.startTime <- Sys.time()

# processing chain summary info
chain_summary_json <- paste(getwd(), 'chain_summary.json', sep = .Platform$file.sep)
if ( file.exists( chain_summary_json ) ) {
  arena.chainSummary <- jsonlite::fromJSON( chain_summary_json )
}
rm( chain_summary_json )
