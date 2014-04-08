angular.module('starter.controllers', [])

    .controller('DashCtrl', function ($scope, FSvc) {
        $scope.foos = FSvc.queryAll();
    })

    .controller('AccountCtrl', function ($scope, AuthenticationService, CredentialsHolder) {
        $scope.message = '';

        $scope.user = {
            username: null,
            password: null
        };

        $scope.showLogout = CredentialsHolder.getCredentials().userId != null;

        $scope.signIn = function() {
            if(!$scope.user.username) {
                return;
            }
            if(!$scope.user.password) {
                return;
            }
            AuthenticationService.login($scope.user);
        };

        $scope.signOut = function() {
            AuthenticationService.logout();
        };
    });
