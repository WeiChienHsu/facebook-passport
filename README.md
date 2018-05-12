# Facebook Passport


This application was created as material that is described in [the blog post](https://medium.com/@robince885/node-js-rest-api-facebook-login-121114ee04d8).
As Angular 2 seed we have used project that is described in [post](https://medium.com/@robince885/angular-2-project-with-bootstrap-1e6fc82dc017) that we have published earlier. 

# What you need to install

* [Node.js](https://nodejs.org/en/)
* [Angular CLI](https://cli.angular.io/)
* [Gulp](http://gulpjs.com/)
* [MongoDB](https://www.mongodb.com/)

# How To Start Application?

* Start MongoDB - our application expects that there is `fb-demo` database in MongoDB
* Go to [frontend](https://github.com/GenFirst/angular2-node-fb-login/tree/master/frontend) folder
    * `npm install`
    * `ng serve`
* Go to [backend](https://github.com/GenFirst/angular2-node-fb-login/tree/master/frontend) folder
    * `npm install`
    * `gulp develop`

![Demo](images/demo.png)

- When users want to register for our application, they will click the “Signup with Facebook”. 

- When the button is clicked, our client application will request an access token from Facebook. 

- Then, the user will be presented with a dialog to allow the application to access some of their Facebook data.

- If the user gives their permission, our client application will "get the Facebook access token in response".

- At this moment we can access user data from the client application, but "an account is not yet created" at our backend.

- In order to create new user account, our client application "sends a request to our backend with the Facebook access token".

- The backend needs to verify the Facebook access token, so it is "sends a verification request directly to Facebook".

- If the Facebook token is valid, the Facebook server will "send user data back to our application".

- Upon receiving this data, the backend server has verified that the user credentials are valid and will create a user profile in our application "with data received from Facebook".

- After that, the backend needs to "create a JSON Web Token (JWT)" which will be used to "identify the user".

- This token is then sent in a response to the client application. 

- The client application will "receive JWT and save it for further use".

- Every "request that goes to the backend server" should "contain a JWT" which uniquely identifies the user.


## Client Setup — Angular 2
In this section we will create a client application in Angular 2. 

We will need to add two additional libraries: bootstrap-social and angular2-jwt:

***

## User Service
For communication with Facebook and our backend server we will create an Angular 2 service. The service will be responsible for(API):

### Facebook Init constructor and AuthHttp
In service constructor we are initializing a library that is used to communicate with Facebook. 

When we get the access token on the frontend, that access token will be valid for our application that is registered on Facebook. If the backend has a different application ID, and try to use access the token send by the frontend, it will fail.

### Logging users in with Facebook profile
In fbLogin we attempt to get the user’s data using FB.login. FB.login will open a Facebook login dialog if the user is not logged in, or a dialog asking to allow the application to use user data if user hasn’t used our application before. 

Response from FB.login contains information on whether user is logged in, and whether they have allowed our application to access their data. 

With that information we are call the backend to log into the application. 

If we manage to log the user into our backend, we will get a token in response in the x-auth-token header. Token will be saved for later use in local storage. 

The same token has to be sent to the server in every request, and it is used to identify the current user.

```js
  fbLogin() {
    return new Promise((resolve, reject) => {
      FB.login(result => {
        if (result.authResponse) {
          return this.http.post(`http://localhost:3000/api/v1/auth/facebook`, {access_token: result.authResponse.accessToken})
              .toPromise()
              // When we receive the response from the Facebook Server
              .then(response => { 
                // We get a token from facebook in order to recognize user
                // Also this x-auth-token will be stored in the local storage
                var token = response.headers.get('x-auth-token');
                if (token) {
                  localStorage.setItem('id_token', token);
                }
                // If successfully get the token, return those 
                // respone as JSON format from the API 
                resolve(response.json());
              })
              // If there is no respone, reject
              .catch(() => reject());
        } else {
          reject();
        }
      }, {scope: 'public_profile,email'})
    });
  }
```

### Logging users out
Remove the token from local storage
```js
  logout() {
    localStorage.removeItem('id_token');
  }
```

### Checking if users are logged in
By using getCurrentUser.

```js
  isLoggedIn() {
    return new Promise((resolve, reject) => {
      this.getCurrentUser().then(user => resolve(true)).catch(() => reject(false));
    });
  }
```
### Getting current user
By using Http Post

```js
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      return this.http.get(`http://localhost:3000/api/v1/auth/me`).toPromise().then(response => {
        resolve(response.json());
      }).catch(() => reject());
    });
  }
}
```

***
## Guards

A common task in the development of any application is deciding what users can and cannot see. Angular 2 has a built in feature for that purpose — navigation guards. There are four different guard types that we can use:

- CanActivate — Decides if a route can be activated
- CanActivateChild — Decides if children routes of a route can be activated
- CanDeactivate — Decides if a route can be deactivated
- CanLoad — Decides if a module can be loaded lazily

In this example, we want to show the login page when the user is not logged in, and a dashboard page when they are. In order to achieve this we will implement two guards:

AuthGuard — To check if the user is logged in
AnonymousGuard — To check if the user is not logged in

***

## AuthGuard
AuthGuard is used to check if the user is logged in. This check will be done by using UserService and it’s isLoggedIn method. If the user is logged in, we will resolve promise, and allow the router to transit to the guarded page. If the user is not logged in, we will navigate them to welcome page.

```js
import { Injectable }       from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Route
}                           from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private userService: UserService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.checkLogin();
    }

    checkLogin(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.userService.isLoggedIn().then(() => {
                resolve(true);
            }).catch(() => {
                this.router.navigate(['/welcome']);
                reject(false);
            });
        });
    }
}
```

## AnonymousGuard

AnonymousGuard is used to check if user is not logged in. This check will, again, be done by UserService and it’s isLoggedIn method. If the user is not logged in, we will resolve promise, and allow the router to transit to the guarded page. If the user is logged in, we will navigate them to dashboard page.

```js
import { Injectable }       from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Route
}                           from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class AnonymousGuard implements CanActivate {

    constructor(private userService: UserService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.checkLogin();
    }

    checkLogin(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.userService.isLoggedIn().then(() => {
                this.router.navigate(['/dashboard']);
                reject(false);
            }).catch(() => {
                resolve(true);
            });
        });
    }
}
```
***

## Pages




***


##
# Passport-Facebook


[FacebookStrategy vs FacebookTokenStrategy](https://github.com/feathersjs/authentication/issues/447)
```
For anyone else trying this approach... /auth/facebook works for the typical OAuth flow with FacebookStrategy, but if you're using token auth with FacebookTokenStrategy, POST to your main authentication endpoint. Using default settings, this is /authentication. The request should just pass your access_token, optionally a refresh_token, and strategy, where strategy is the name of your configured OAuth strat. In this case, I named my token strategy facebook-token, and left the regular strategy as just facebook.
```



*** 
# Source
[Source](https://codeburst.io/node-js-rest-api-facebook-login-121114ee04d8)
[Soucre Code @ GenFirst](https://github.com/GenFirst)

# License

angular2-node-fb-login is released under [MIT License](https://opensource.org/licenses/MIT).