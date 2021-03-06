'use strict';

angular.module('umm3601ursamajorApp')
  .controller('StatuseditorCtrl', function ($scope, $http, Auth, $location, User, Modal, socket) {
        if(Auth.isAdmin() || Auth.isChair()) {
        } else {
            $location.path('/');
        }
        $scope.users = User.query();
        $scope.isAdmin = Auth.isAdmin;
        $scope.isChair = Auth.isChair;
        $scope.statusArray = [];
        $scope.submissions = [];


        $http.get('/api/statuss').success(function(statusArray) {
            $scope.statusArray = statusArray;
        });

        $http.get('/api/submissions').success(function(submissions) {
            $scope.submissions = submissions;
            socket.syncUpdates('submission', $scope.submissions);
        });

        $scope.getStatuses = function(){
            $http.get('/api/statuss').success(function(statusArray) {
                $scope.statusArray = statusArray;
            });
        };

        $scope.statusEditorColor = function(status){
            return {'border-left': '4px solid rgb(' + status.color.red   + ','
                                                    + status.color.green + ','
                                                    + status.color.blue  + ')'};
        };

        $scope.deleteSubmissionConfirm = function(item){
            Modal.confirm.delete($scope.deleteSubmission)(item.strict, item);
        };
        $scope.deleteStatus = function(item){
            var r = confirm("Are you sure you want to delete this status? All statuses with this status will need to be changed.")

            if(r == true) {
                $http.delete('/api/statuss/' + item._id).success(function () {
                    $scope.statusArray.splice($scope.statusArray.indexOf(item), 1);
                });
                var threshold = item.priority;
                for (var j = 0; j < $scope.statusArray.length; j++) {
                    if ($scope.statusArray[j].priority != 15 && $scope.statusArray[j].priority != -15) {
                        if ($scope.statusArray[j].priority > threshold) {
                            $scope.statusArray[j].priority--;
                            $http.patch('/api/statuss/' + $scope.statusArray[j]._id,
                            {priority: $scope.statusArray[j].priority})
                        }
                    }
                }
            }
        };

        $scope.findEmptyPriority = function(status){
            var count = 2;
            for(var j = 0; j < status.length; j++) {
                for (var i = 0; i < status.length; i++) {
                    if (status[i].priority == count) {
                        count++;
                    }
                }
            }
            return count;
        };

        $scope.addStatus = function() {
            var r = confirm("Are you sure you want to add a status?")
            if(r == true) {
                $http.post('/api/statuss/',
                    {   strict: "Default Status",
                        color: {red: 0, green: 0, blue: 0, alpha: 1},
                        emailSubject: "",
                        emailBody: "",
                        priority: $scope.findEmptyPriority($scope.statusArray),
                        required: false
                    }).success(function () {
                        console.log("Successfully added new status")
                        $scope.getStatuses();
                    });
            }
        };


        $scope.requiredStatus = function(status){
            return(status.required);
        };



//        $scope.submitChanges = function(status) {
//            var r = confirm("Are you sure you want to edit this status?");
//            var strict = "";
//            var conflict = false;
//            var priorityOne = false;
//            var x = $scope.statusArray.indexOf(status);
//            if (r) {
//                for (var i = 0; i < $scope.statusArray.length; i++) {
//                    if ($scope.statusArray[i].priority == status.priority) {
//                        if ($scope.statusArray[i]._id != status._id) {
//                            conflict = true;
//                        }
//
//                    }
//                    if (status.priority == 1) {
//                        priorityOne = true;
//                    }
//                }
//                if (!conflict && !priorityOne) {
//                    $http.patch('/api/statuss/' + $scope.statusArray[x]._id,
//                        {
//                            strict: $scope.statusArray[x].strict,
//                            color: $scope.statusArray[x].color,
//                            emailSubject: $scope.statusArray[x].emailSubject,
//                            emailBody: $scope.statusArray[x].emailBody,
//                            priority: $scope.statusArray[x].priority
//                        }
//                    ).success(function () {
//                            $location.path('/admin');
//                            for (var j = 0; j < $scope.submissions.length; j++) {
//                                if ($scope.submissions[j].status.strict == strict) {
//                                    console.log("things were detected to be different");
//                                    $scope.submissions[j].status.strict = $scope.statusArray[x].strict;
//                                    $http.patch('/api/submissions/' + $scope.submissions[j]._id, {
//                                        status: {strict: $scope.statusArray[x].strict, text: $scope.submissions[j].status.text}
//                                    })
//
//
//                                } else {
//                                    alert("There already exists a status with this priority.")
//                                }
//                            }
//                        })
//                }
//
//            }
//        }
        $scope.submitChanges = function(status) {
            var r = confirm("Are you sure you want to edit this status?");
            var strict = "";
            var problem = false;
            var x = $scope.statusArray.indexOf(status);
            if (r) {
                for (var i = 0; i < $scope.statusArray.length; i++) {
                    if ($scope.statusArray[i].priority == status.priority) {
                        if ($scope.statusArray[i]._id != status._id) {
                            problem = true;
                        }

                    }
                    if ((status.priority <= 1 || status.priority >= 15) && (status.required == false)) {
                        problem = true;
                    }


                }
                if (!problem) {
                    $http.get('/api/statuss/' + $scope.statusArray[x]._id).success(function (oldStatus) {
                        strict = oldStatus.strict;

                        $http.patch('/api/statuss/' + $scope.statusArray[x]._id,
                            {
                                strict: $scope.statusArray[x].strict,
                                color: $scope.statusArray[x].color,
                                emailSubject: $scope.statusArray[x].emailSubject,
                                emailBody: $scope.statusArray[x].emailBody,
                                priority: $scope.statusArray[x].priority
                            }
                        ).success(function () {
                                $location.path('/admin');
                                for (var j = 0; j < $scope.submissions.length; j++) {
                                    if ($scope.submissions[j].status.strict == strict) {
                                        console.log("things were detected to be different");
                                        $scope.submissions[j].status.strict = $scope.statusArray[x].strict;
                                        $http.patch('/api/submissions/' + $scope.submissions[j]._id, {
                                            status: {strict: $scope.statusArray[x].strict, text: $scope.submissions[j].status.text}
                                        })

                                    }
                                }
                            })
                    })


                } else {
                    //alert("There already exists a status with this priority.")
                    alert("There is a problem using this priority (priority is less than 2, greater than 14, or shares a priority with another status). Please, pick a new one.")
                }
            }
        }

    });
