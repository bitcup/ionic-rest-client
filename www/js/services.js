angular.module('starter.services', ['ngResource'])

    // interceptor to add Authorization header for all requests - calculates HMAC via RequestSigner
    // note: also, for this to work, the server needs to accept Authorization header
    // -- see 'Access-Control-Allow-Headers' in CorsFilter
    .factory('hmacInterceptor', function ($q, $log, RequestSigner, CredentialsHolder) {
        return {
            'request': function (config) {
                // add authorization header to remote requests only
                if (config.url.indexOf('http') == 0) {
                    $log.info('signing request with url: ' + config.url);
                    var uri = (new URI(config.url)).pathname();
                    // get userId and privateKey from CredentialsHolder
                    // note: userId and privateKey are sent to client upon login, stored in localStorage thereafter
                    var credentials = CredentialsHolder.getCredentials();
                    if (credentials != null && credentials.userId != null && credentials.privateKey != null) {
                        var signedRequest = RequestSigner.sign(uri, credentials.userId, credentials.privateKey);
                        config.headers.Authorization = 'FOO ' + signedRequest.userId + ':' + signedRequest.signature;
                        $log.info('config.headers: ' + JSON.stringify(config.headers));
                    }
                }
                return config || $q.when(config);
            },
            'responseError': function (rejection) {
                // redirect to login view on 401
                $log.info("http interceptor caught a response error with status=" + rejection.status);
                if (rejection.status == 401) {
                    if (rejection.config.url != 'http://localhost:8080/login') {
                        $log.info("redirecting to login...");
                        //$log.info(JSON.stringify(rejection));
                        window.location = '#/tab/account';
                    }
                }
                return $q.reject(rejection);
            }
        };
    })

    // add interceptor to sign remote requests
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('hmacInterceptor');
    })

    // demonstrates signing remote requests via interceptor
    .factory('FSvc', ['$resource', function ($resource) {
        return $resource('http://localhost:port/api/v1.0/foo/list', {port: ":8080"}, {
            queryAll: {method: 'GET', isArray: true}
        });
    }])

    // request signer
    // note: this needs to be improved to support POST params, not just request params
    .factory('RequestSigner', function () {
        var params = {};
        return {
            sign: function (uri, userId, privateKey) {
                params.userId = userId;
                params.signature = CryptoJS.HmacSHA1(uri, privateKey).toString();
                return params;
            }
        }
    })

    // holder of userId and privateKey in local storage
    // - userId and privateKey are obtained in response to /login POST (on success)
    // - credential params are deleted on /logout success
    .factory('CredentialsHolder', ['$log', function ($log) {
        var params = {};
        return {
            getCredentials: function () {
                params.userId = window.localStorage.getItem("ionic.client.userId");
                params.privateKey = window.localStorage.getItem("ionic.client.privateKey");
                return params;
            },
            setCredentials: function (userId, privateKey) {
                $log.info('saving userId and privateKey');
                window.localStorage.setItem("ionic.client.userId", userId);
                window.localStorage.setItem("ionic.client.privateKey", privateKey);
            },
            resetCredentials: function () {
                $log.info('reset userId and privateKey');
                window.localStorage.removeItem("ionic.client.userId");
                window.localStorage.removeItem("ionic.client.privateKey");
            }
        }
    }])

    // service to make login/logout requests to remote server
    .factory('AuthenticationService', ['$http', '$log', 'CredentialsHolder', function ($http, $log, CredentialsHolder) {
        return {
            login: function (user) {
                // THIS SHOULD BE HTTPS because privateKey should not be exposed over http
                $http.post('http://localhost:8080/login', user).success(function (data) {
                    CredentialsHolder.setCredentials(data.userId, data.privateKey);
                    window.location = '#/tab/dash';
                }).error(function (data) {
                        //$log.info('in AuthenticationService, there was an error in login');
                    }
                );
            },
            logout: function () {
                $log.info('user logged out');
                CredentialsHolder.resetCredentials();
                window.location = '#/tab/dash';
            }
        }
    }])

;
