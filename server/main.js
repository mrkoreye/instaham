var apiBase = 'https://api.instagram.com/v1'
var tagApiBase = apiBase + '/tags/'
var userApiBase = apiBase + '/users/'
var recentPath = '/media/recent'
var clientIdParam = '?client_id=1dfaccb4925d44adbcd569ac5f3b618a'
var genericErrorMessage = "Error: API call failed for the url: "

var processUsers = function(users) {
  var usersArray = [];
  _.each(users, function(user, userId) {
    newUser = _.extend({}, {
        username: user.username,
        id: userId,
        count: user.count,
        followers: user.followers
      }
    );

    usersArray.push(newUser);
  })

  sortedUsersArray = Helpers.sortUsers(usersArray);

  return sortedUsersArray;
}

var findTotalTags = function (tag) {
  try {
    var url = tagApiBase + tag + clientIdParam;
    var result = HTTP.get(url);

    if (result.data) {
      var totalCount = result.data.data.media_count;
      var num = Tags.update({tagName: tag}, {$set: {totalCount: totalCount}});
    }
  } catch (e) {
    throw new Meteor.error(500, genericErrorMessage + url);
  }
}

Meteor.methods({
  findUniqueUsersWithTag: function (tag) {
    this.unblock();
    Tags.remove({tagName: tag});
    var currentTime = new Date();
    Tags.insert({tagName: tag, lastUpdated: currentTime, loading: true});
    findTotalTags(tag);

    var url = tagApiBase + tag + recentPath + clientIdParam;
    var keepLooking = true;
    var users = {};

    while (keepLooking) {
      try {
        var result = HTTP.get(url);
      } catch (e) {
        throw new Meteor.error(500, genericErrorMessage + url);
      }

      if (result.data.pagination && result.data.pagination.next_url) {
        url = result.data.pagination.next_url;
      }
      else {
        keepLooking = false;
      }

      if (result.data) {
        _.each(result.data.data, function(post) {
          var currentUserId = post.user.id;
          if (users[currentUserId]) {
            users[currentUserId].count += 1;
          }
          else {
            var userId = post.user.id;
            var userUrl = userApiBase + userId + clientIdParam;
            var followers = 0;

            try {
              var fullProfile = HTTP.get(userUrl).data;
              if (fullProfile.data && fullProfile.data.counts) {
                followers = fullProfile.data.counts.followed_by
              }
            } catch (e) {
              throw new Meteor.error(500, genericErrorMessage + userUrl);
            }

            users[currentUserId] = {
              count: 1,
              username: post.user.username,
              followers: followers
            };
          }
        });

        var processedUsers = processUsers(users);
        Tags.update({tagName: tag}, {$set: { users: processedUsers}});
      }
    }

    Tags.update({tagName: tag}, {$set: {loading: false}});
  }
});
