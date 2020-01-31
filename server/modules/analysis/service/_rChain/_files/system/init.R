#= remove all objects in session
rm(list = ls());

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
#=== Function used to load a library if installed, if not it installs it first
#===
usePackage <- function(p) {
  if (!is.element(p, installed.packages()[, 1]))
    install.packages(p, dep = TRUE)
  library(p, character.only = TRUE)
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

# sqldf options.
# driver is set to SQLLite in order to read from dataframe , otherwise it uses PostgreSQL which is the default driver loaded
# https://code.google.com/p/sqldf/#Troubleshooting
options(
  gsubfn.engine = "R",
  sqldf.driver = "SQLite"
);

usePackage("RPostgreSQL");
usePackage("sqldf");

driver <- dbDriver("PostgreSQL");

