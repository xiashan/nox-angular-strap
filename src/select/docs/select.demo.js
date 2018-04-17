'use strict';

angular.module('mgcrea.ngStrapDocs')

.controller('SelectDemoCtrl', function ($scope, $http) {

  $scope.selectedIcon = '';
  $scope.selectedIcons = ['Globe', 'Heart'];
  $scope.icons = [
    {value: 'Gear', label: '<i class="fa fa-gear"></i> Gear'},
    {value: 'Globe', label: '<i class="fa fa-globe"></i> Globe'},
    {value: 'Heart', label: '<i class="fa fa-heart"></i> Heart'},
    {value: 'Camera', label: '<i class="fa fa-camera"></i> Camera'}
  ];
  $scope.contentBody = [
    {
      'id': 1,
      'text': 'hehtestqqqqqqq'
    },
    {
      'id': 2,
      'text': 'campaign id 2'
    },
    {
      'id': 3,
      'text': 'name11111111111111'
    },
    {
      'id': 4,
      'text': 'name2222222222222'
    },
    {
      'id': 5,
      'text': '3'
    },
    {
      'id': 6,
      'text': 'name'
    },
    {
      'id': 7,
      'text': 'name'
    },
    {
      'id': 8,
      'text': 'name'
    },
    {
      'id': 9,
      'text': 'name'
    },
    {
      'id': 10,
      'text': 'name'
    },
    {
      'id': 11,
      'text': 'name'
    },
    {
      'id': 12,
      'text': 'name'
    },
    {
      'id': 13,
      'text': 'name'
    },
    {
      'id': 14,
      'text': '2222222222'
    },
    {
      'id': 15,
      'text': '2222222222'
    },
    {
      'id': 16,
      'text': '2222222222'
    },
    {
      'id': 17,
      'text': '2222222222'
    },
    {
      'id': 18,
      'text': '2222222222'
    },
    {
      'id': 19,
      'text': '2222222222'
    },
    {
      'id': 20,
      'text': '2222222222'
    },
    {
      'id': 21,
      'text': '2222222222'
    },
    {
      'id': 22,
      'text': '2222222222'
    },
    {
      'id': 23,
      'text': '2222'
    },
    {
      'id': 24,
      'text': '2222'
    },
    {
      'id': 25,
      'text': '2222'
    },
    {
      'id': 26,
      'text': '2222'
    },
    {
      'id': 27,
      'text': '2222'
    },
    {
      'id': 28,
      'text': '2222'
    },
    {
      'id': 29,
      'text': '213'
    },
    {
      'id': 33,
      'text': '3214124'
    },
    {
      'id': 34,
      'text': '1234'
    },
    {
      'id': 35,
      'text': 'hehe2134'
    },
    {
      'id': 36,
      'text': '124'
    },
    {
      'id': 37,
      'text': 'hehe_134'
    },
    {
      'id': 38,
      'text': 'campaign_test'
    },
    {
      'id': 39,
      'text': '134234'
    },
    {
      'id': 40,
      'text': '1842034'
    },
    {
      'id': 49,
      'text': 'sdf'
    },
    {
      'id': 50,
      'text': 'campaign-name'
    },
    {
      'id': 51,
      'text': 'campaign_001'
    },
    {
      'id': 52,
      'text': 'aaaaaa'
    },
    {
      'id': 53,
      'text': 'qqqq'
    },
    {
      'id': 54,
      'text': 'Test'
    },
    {
      'id': 55,
      'text': 'campaign_test'
    },
    {
      'id': 67,
      'text': 'LYTest--'
    },
    {
      'id': 68,
      'text': 'test_tanzhq'
    },
    {
      'id': 82,
      'text': 'tanzhq_test1'
    },
    {
      'id': 83,
      'text': 'lycamp1--'
    },
    {
      'id': 86,
      'text': '请勿动-投放测试'
    },
    {
      'id': 87,
      'text': 'pubcamp'
    },
    {
      'id': 88,
      'text': 'Test'
    },
    {
      'id': 100,
      'text': 'jerry_test_1'
    },
    {
      'id': 101,
      'text': 'f'
    },
    {
      'id': 102,
      'text': 'wr'
    },
    {
      'id': 103,
      'text': 'test'
    },
    {
      'id': 104,
      'text': '3214'
    },
    {
      'id': 105,
      'text': 'asfd'
    },
    {
      'id': 111,
      'text': 'test_impersss'
    },
    {
      'id': 112,
      'text': 'testa3'
    },
    {
      'id': 113,
      'text': 'sadf'
    },
    {
      'id': 114,
      'text': 'test_san'
    },
    {
      'id': 115,
      'text': 'ShareFromOffer'
    },
    {
      'id': 116,
      'text': '5s5'
    },
    {
      'id': 117,
      'text': 'last_test_1'
    },
    {
      'id': 118,
      'text': '姚佳楠'
    },
    {
      'id': 119,
      'text': '姚佳楠'
    },
    {
      'id': 120,
      'text': '姚佳楠'
    },
    {
      'id': 121,
      'text': 'ShareFromOffer'
    },
    {
      'id': 122,
      'text': 'ShareFromOffer'
    },
    {
      'id': 123,
      'text': 'af_camp'
    },
    {
      'id': 124,
      'text': 'moba-duel'
    },
    {
      'id': 125,
      'text': 'tanzhqtanzhq'
    },
    {
      'id': 126,
      'text': '222'
    },
    {
      'id': 127,
      'text': '222'
    },
    {
      'id': 128,
      'text': '222'
    },
    {
      'id': 129,
      'text': '222'
    },
    {
      'id': 130,
      'text': '222'
    },
    {
      'id': 131,
      'text': '1'
    },
    {
      'id': 132,
      'text': 'ly-adjust-playable-an'
    },
    {
      'id': 133,
      'text': 'ly-af-video-an'
    },
    {
      'id': 134,
      'text': 'ly-adjust-playable-ios'
    },
    {
      'id': 135,
      'text': 'hehetest0201'
    },
    {
      'id': 136,
      'text': 'hehetest002'
    },
    {
      'id': 137,
      'text': 'this is a test campaign'
    },
    {
      'id': 138,
      'text': 'tanzhq_campaign_1'
    },
    {
      'id': 139,
      'text': '123132'
    },
    {
      'id': 140,
      'text': '测试'
    },
    {
      'id': 141,
      'text': '1'
    },
    {
      'id': 142,
      'text': '2332'
    },
    {
      'id': 300,
      'text': 'test'
    },
    {
      'id': 301,
      'text': 'aqqqqqqaaaaaaaa'
    },
    {
      'id': 302,
      'text': 'tanzhq_report'
    }
  ];

  $scope.selectedMonth = 0;
  $scope.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

});
