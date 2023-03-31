global_arena_error <- FALSE  
global_arena_errors <- list()

saveError = function(e) {
    print(e);
    global_arena_error <<- TRUE;
    global_arena_errors <<- append(global_arena_errors, e);
}

clearGlobalErrors = function () {
    global_arena_error <<- FALSE;
    global_arena_errors <<- list()
}

checkGlobalErrors = function(message) {
    if (length(global_arena_errors) > 0) {
        errorlist.call <- global_arena_errors[grep("call", names(global_arena_errors))]
        errorlist.msg <- global_arena_errors[grep("message", names(global_arena_errors))]
        
        n_errors <- length(errorlist.msg)
        cat("\033[0;31m", "ERRORS IN THE CHAIN", "\033[0m","\n")
        
        for (e_list in (1 : n_errors)) {
            cat("***")
            arena_r_message <- as.character(errorlist.msg[e_list])
            cat("\033[0;31m", arena_r_message, "\033[0m","\n\n")
        }
        
        if (interactive()) {
            aReply=askYesNo(paste0(" Errors in the chain, see the console!\n\n ", message, "\n\n Clear chain's error list and try to fix the issues?"), default = FALSE)
            if (aReply==TRUE) {
                clearGlobalErrors()
            }
        }
        return(FALSE)    
    } else {
        return(TRUE)
    }
}