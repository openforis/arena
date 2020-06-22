# Login test

tags: login, user

The user must be able to login with correct credentials and receive an error message with incorrect credentials

## Unsuccessful Login

tags: login

For a wrong password or email, the user receives an error message

* Login with "test@arena.com" and "error"
* Page contains "User not found. Make sure email and password are correct"

## Successful Login

tags: login

For an existing user, the login allows the user to login

* Login with "test@arena.com" and "test"
* Wait for ".home-dashboard" to exist
