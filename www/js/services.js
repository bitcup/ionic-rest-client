angular.module('starter.services', ['ngResource'])

    // interceptor to add Authorization header for all requests - calculates HMAC via RequestSigner
    // note: also, for this to work, the server needs to accept Authorization header
    // -- see 'Access-Control-Allow-Headers' in CorsFilter
    .factory('hmacInterceptor', function ($q, $log, RequestSigner, CredentialsHolder) {
        return {
            'request': function (config) {
                // add authorization header to remote requests only
                if (config.url.indexOf('http') == 0) {
                    $log.debug('signing request with url: ' + config.url);
                    var uri = (new URI(config.url)).pathname();
                    // get userId and privateKey of logged in user
                    // note: if user not logged in (requesting a login), then don't sign the request
                    if (CredentialsHolder.isLoggedIn()) {
                        var credentials = CredentialsHolder.getCredentials();
                        var signedRequest = RequestSigner.sign(uri, credentials.userId, credentials.privateKey);
                        config.headers.Authorization = 'FOO ' + signedRequest.userId + ':' + signedRequest.signature;
                        $log.debug('config.headers: ' + JSON.stringify(config.headers));
                    }
                }
                return config || $q.when(config);
            }
            ,'responseError': function (rejection) {
                // redirect to login view on 401
                $log.debug("http interceptor caught a response error with status=" + rejection.status);
                /*
                if (rejection.status == 401) {
                    $log.debug("redirecting to login...");
                    window.location = '#/login';
                }
                */
                return $q.reject(rejection);
            }
        };
    })

    // add interceptor to sign remote requests
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('hmacInterceptor');
    })

    // demonstrates signing remote requests via interceptor
    .factory('FSvc', ['$resource', 'API_HOST', function ($resource, API_HOST) {
        return $resource(API_HOST + '/api/v1.0/foo/list', {}, {
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
                $log.debug('saving userId and privateKey');
                window.localStorage.setItem("ionic.client.userId", userId);
                window.localStorage.setItem("ionic.client.privateKey", privateKey);
            },
            resetCredentials: function () {
                $log.debug('reset userId and privateKey');
                window.localStorage.removeItem("ionic.client.userId");
                window.localStorage.removeItem("ionic.client.privateKey");
            },
            isLoggedIn: function () {
                $log.debug('checking if user is logged in...');
                var userId = window.localStorage.getItem("ionic.client.userId");
                $log.debug('userId: ' + userId);
                return userId != null;
            }
        }
    }])

    // service to make login/logout requests to remote server
    .factory('AuthenticationService', ['$http', '$log', '$state', 'CredentialsHolder', 'API_HOST',
        function ($http, $log, $state, CredentialsHolder, API_HOST) {
            return {
                login: function (user) {
                    // THIS SHOULD BE HTTPS because privateKey should not be exposed over http
                    $http.post(API_HOST + '/login', user).success(function (data) {
                        CredentialsHolder.setCredentials(data.userId, data.privateKey);
                        $state.go('tab.dash');
                    }).error(function (data) {
                            $log.debug('in AuthenticationService, there was an error in login');
                        }
                    );
                },
                logout: function () {
                    $log.debug('user logged out');
                    CredentialsHolder.resetCredentials();
                    $state.go('login');
                }
            }
        }])

    // trigger the loading indicator
    .factory('LoaderService', function ($rootScope, $ionicLoading) {
        return {
            show: function () {
                $rootScope.loading = $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 5
                });
            },
            hide: function () {
                $rootScope.loading.hide();
            }
        }
    })

;
