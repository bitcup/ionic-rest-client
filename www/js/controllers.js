angular.module('starter.controllers', [])

    .controller('DashCtrl', function ($scope, $state, FSvc, CredentialsHolder) {
        $scope.isLoggedIn = CredentialsHolder.isLoggedIn();
        if ($scope.isLoggedIn) {
            $scope.foos = FSvc.queryAll();
        } else {
            $state.go('tab.account');
        }
    })

    .controller('AccountCtrl', function ($scope, AuthenticationService, CredentialsHolder, LoaderService) {
        $scope.message = '';

        $scope.user = {
            username: null,
            password: null
        };

        $scope.showLogout = CredentialsHolder.isLoggedIn();

        $scope.signIn = function() {
            if(!$scope.user.username || !$scope.user.password) {
                return;
            }
            LoaderService.show();
            AuthenticationService.login($scope.user);
            LoaderService.hide();
        };

        $scope.signOut = function() {
            AuthenticationService.logout();
        };
    });
