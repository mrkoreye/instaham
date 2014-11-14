if (Meteor.isClient) {
  Session.setDefault('totalNumTags', '.');
  Session.setDefault('numUniqueUsers', '.');
  Session.setDefault('tag', 'shopstyleit');

  var findTotalTags = function (tag) {
    Meteor.call('findTotalTags', tag, function(error, result) {
      if (!error) {
        Session.set('totalNumTags', result.data.data.media_count);
      }
    });
  }

  var findUniqueUsersWithTag = function (tag) {
    Meteor.call('findUniqueUsersWithTag', tag, function(error, result) {
      if (!error) {
        Session.set('numUniqueUsers', result.count);
      }
    });
  }

  var updateTagData = function () {
    findTotalTags(Session.get('tag'));
    // findUniqueUsersWithTag(Session.get('tag'));
  }

  Tracker.autorun(updateTagData);

  Template.tagsummary.helpers({
    totalNumTags: function () {
      return Session.get('totalNumTags');
    },
    numUniqueUsers: function () {
      return Session.get('numUniqueUsers');
    },
    tag: function () {
      return Session.get('tag');
    },
    loadingTotal: function () {
      if (Session.get('totalNumTags') === '.') {
        return 'loading'
      }
      else {
        return '';
      }
    },
    loadingUnique: function () {
      if (Session.get('numUniqueUsers') === '.') {
        return 'loading'
      }
      else {
        return '';
      }
    }
  });

  Template.input.events({
    'submit': function (event) {
      event.preventDefault();
      tag = event.target[0].value;
      Session.set('tag', tag);
    }
  });

  Template.input.helpers({
    tag: function () {
      return Session.get('tag');
    }
  });
}

if (Meteor.isServer) {
  var apiBase = 'https://api.instagram.com/v1/tags/'
  var recentPath = '/media/recent'
  var clientIdParam = '?client_id=1dfaccb4925d44adbcd569ac5f3b618a'

  Meteor.methods({
    findTotalTags: function (tag) {
      var url = apiBase + tag + clientIdParam;
      return HTTP.get(url);
    },

    findUniqueUsersWithTag: function (tag) {
      var url = apiBase + tag + recentPath + clientIdParam;
      var keepLooking = true;
      var uniqueUsers = {
        users: {}
      }
      var users = uniqueUsers.users;
      var numUniqueUsers = 0;

      while (keepLooking) {
        var result = HTTP.get(url);
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
              users[currentUserId].count = users[currentUserId].count + 1;
            }
            else {
              numUniqueUsers++;
              users[currentUserId] = {
                count: 1,
                userName: post.user.username
              };
            }
          })
        }

        if (numUniqueUsers > 2000) {
          keepLooking = false;
          return 'over 1000';
        }

      }
      uniqueUsers.count = numUniqueUsers;
      return uniqueUsers;
    }
  });
}
