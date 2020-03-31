#===
#=== Function used to load a library if installed, if not it installs it first
#===
usePackage <- function(p) {
  if (!is.element(p, installed.packages()[, 1]))
    install.packages(p, dep = TRUE)
  library(p, character.only = TRUE)
};

usePackage("RPostgreSQL");
usePackage("sqldf");
usePackage("httr");
usePackage("jsonlite");
