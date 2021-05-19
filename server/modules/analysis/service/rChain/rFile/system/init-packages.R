#**
#* Load a library if installed, if not it installs it first
#**
usePackage <- function(name) {
  if (!is.element(name, installed.packages()[, 1]))
    install.packages(name, dep = TRUE)
  library(name, character.only = TRUE)
}

usePackage("sqldf")
usePackage("httr")
usePackage("jsonlite")
usePackage('zip')

usePackage('data.table')