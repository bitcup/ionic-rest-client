angular.module('starter.controllers', [])

    .controller('DashCtrl', function ($scope, $state, FSvc, CredentialsHolder) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }
        $scope.foos = FSvc.queryAll();
    })

    .controller('AccountCtrl', function ($scope, $state, CredentialsHolder, AuthenticationService) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }
        $scope.signOut = function () {
            AuthenticationService.logout();
        };
    })

    .controller('LoginCtrl', function ($scope, AuthenticationService) {
        $scope.user = {
            username: null,
            password: null
        };

        $scope.logIn = function () {
            if (!$scope.user.username || !$scope.user.password) {
                return;
            }
            AuthenticationService.login($scope.user);
        };
    })

;
