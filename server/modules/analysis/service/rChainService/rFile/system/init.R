#= remove all objects in session
rm(list = ls());

scriptDir <- dirname(sys.frame(1)$ofile);
if( scriptDir == 'system' ){
  scriptDir <- '.';
}

# processing chain starting time
arena.startTime <- Sys.time();

#==
#== function used to check if the execution of a task returned an error
#==
checkError <- function(e, connection = NULL) {
  if (inherits(e, "try-error") || inherits(e, "simpleError")) {
    print("ARENA-ERROR", quote = F);
    if (!is.null(connection)) {
      dbDisconnect(connection);
    }
    stop(e);
  }
};

#===
#=== Logging functions
#===
arena.log <- function(step, msg, level) {
  row1 <- paste(Sys.time(), step, sep = "     step : ");
  cat(row1);

  row2 <- paste("\n", level, sep = "");
  row2 <- paste(row2, ':', sep = "");
  row2 <- paste(row2, msg, sep = " ");
  row2 <- paste(row2, '\n', sep = " ");
  cat(row2);
};
arena.info <- function(step, msg) {
  arena.log(step, msg, "INFO");
};
arena.warn <- function(step, msg) {
  arena.log(step, msg, "WARN");
};
arena.error <- function(step, msg) {
  arena.log(step, msg, "ERROR");
};
arena.debug <- function(step, msg) {
  arena.log(step, msg, "DEBUG");
};

#===
#=== Extracts the content of a file and returns it as an SQL quoted string  
#===
arena.getQuotedFileContent <- function( filename ){
  newLinePlaceHolder <- 'ARENA_NEW_LINE_PLACEHOLDER';
  
  filePath <- paste(scriptDir , filename , sep = .Platform$file.sep);
  
  c <- file(filePath, encoding = "UTF-8");
  fileContent <- paste(readLines(c, warn = F), collapse = newLinePlaceHolder)
  close(c);
  
  fileContent <- dbQuoteString( conn = connection , x = fileContent );
  fileContent <- gsub(newLinePlaceHolder,'\n',fileContent);

  return ( fileContent );
};

#===
#=== Stores the content of the specified file into a column of the specified table.
#===
arena.persistUserScript <- function( filename , schema ,  table , column , uuid ){
	fileContent <- arena.getQuotedFileContent( filename );
	
  query <- sprintf('UPDATE %s.%s SET %s = %s WHERE uuid = \'%s\'', schema, table, column, fileContent, uuid)
	
	#print( query );
	
	dbSendQuery(conn=connection, statement=query);
};

arena.persistCalculationScript <- function( filename , schema , calculationUuid ){
  arena.persistUserScript(filename, schema, 'processing_step_calculation', 'script', calculationUuid)
}

# sqldf options.
# driver is set to SQLLite in order to read from dataframe , otherwise it uses PostgreSQL which is the default driver loaded
# https://code.google.com/p/sqldf/#Troubleshooting
options(
  gsubfn.engine = "R",
  sqldf.driver = "SQLite"
);

driver <- dbDriver("PostgreSQL");

