global_arena_error <- FALSE  
global_arena_errors <- list()

saveError = function(e) {
    print(e);
    global_arena_error <<- TRUE;
    global_arena_errors <<- append(global_arena_errors, e);
}