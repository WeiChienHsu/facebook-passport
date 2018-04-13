import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { AuthHttp } from 'angular2-jwt';
import FACEBOOK_ID from '../../src/config.js';

declare const FB:any;

@Injectable()
export class UserService {

  constructor(private http: AuthHttp) {
    FB.init({
      appId      : FACEBOOK_ID,
      status     : false, // the SDK will attempt to get info about the current user immediately after init
      cookie     : false,  // enable cookies to allow the server to access
      // the session
      xfbml      : false,  // With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML
      version    : 'v2.8' // use graph api version 2.5
    });
  }

  fbLogin() {
    return new Promise((resolve, reject) => {
      FB.login(result => {
        if (result.authResponse) {
          return this.http.post(`http://localhost:3000/api/v1/auth/facebook`, {access_token: result.authResponse.accessToken})
              .toPromise()
              // When we receive the response from the Facebook Server
              .then(response => { 
                // We get a x-auth-token from facebook in order to 
                // recognize user in the future
                
                // Also this id-token will be stored in the local storage
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

  logout() {
    localStorage.removeItem('id_token');
  }

  isLoggedIn() {
    return new Promise((resolve, reject) => {
      this.getCurrentUser().then(user => resolve(true)).catch(() => reject(false));
    });
  }

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      return this.http.get(`http://localhost:3000/api/v1/auth/me`).toPromise().then(response => {
        resolve(response.json());
      }).catch(() => reject());
    });
  }
}