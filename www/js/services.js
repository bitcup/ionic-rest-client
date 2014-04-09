angular.module('starter.services', ['ngResource'])

    // interceptor to add Authorization header for all requests - calculates HMAC via RequestSigner
    // note: also, for this to work, the server needs to accept Authorization header
    // -- see 'Access-Control-Allow-Headers' in CorsFilter
    .factory('hmacInterceptor', function ($q, $log, RequestSigner, CredentialsHolder, API_HOST) {
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
                    if (rejection.config.url != API_HOST + '/login') {
                        $log.info("redirecting to login...");
                        $state.go('tab.account');
                        //window.location = '#/tab/account';
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
                $log.info('saving userId and privateKey');
                window.localStorage.setItem("ionic.client.userId", userId);
                window.localStorage.setItem("ionic.client.privateKey", privateKey);
            },
            resetCredentials: function () {
                $log.info('reset userId and privateKey');
                window.localStorage.removeItem("ionic.client.userId");
                window.localStorage.removeItem("ionic.client.privateKey");
            },
            isLoggedIn: function () {
                $log.info('checking if user is logged in...');
                var userId = window.localStorage.getItem("ionic.client.userId");
                $log.info('userId: ' + userId);
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
                        $log.info('in AuthenticationService, there was an error in login');
                    }
                );
            },
            logout: function () {
                $log.info('user logged out');
                CredentialsHolder.resetCredentials();
                $state.go('tab.dash');
            }
        }
    }])

    .factory('LoaderService', function ($rootScope, $ionicLoading) {

        // Trigger the loading indicator
        return {
            show: function () { //code from the ionic framework doc

                // Show the loading overlay and text
                $rootScope.loading = $ionicLoading.show({

                    // The text to display in the loading indicator
                    content: 'Loading',

                    // The animation to use
                    animation: 'fade-in',

                    // Will a dark overlay or backdrop cover the entire view
                    showBackdrop: true,

                    // The maximum width of the loading indicator
                    // Text will be wrapped if longer than maxWidth
                    maxWidth: 200,

                    // The delay in showing the indicator
                    showDelay: 5
                });
            },
            hide: function () {
                $rootScope.loading.hide();
            }
        }
    })

;
