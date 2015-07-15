Session.setDefault('tag', 'shopstyleit');

var updateTagData = function () {
  var tag = Session.get('tag');
  Meteor.call('findUniqueUsersWithTag', tag, function(error) {
    if (error && error.reason) {
      Session.set('errorMessage', error.reason);
      var tagInfo = Session.get('tagInfo');
      if (tagInfo) {
        Tags.update({_id: tagInfo._id}, {$set: {loading: false}});
      }
    }
  });
}

var getTagInfo = function() {
  var tag = Session.get('tag');
  var newTagInfo = Tags.findOne({tagName: tag});
  if (newTagInfo) {
    newTagInfo.users = Helpers.sortUsers(newTagInfo.users)
    Session.set('tagInfo', newTagInfo);
  }
}

Tracker.autorun(getTagInfo)

Template.tagsummary.helpers({
  totalNumTags: function () {
    var tagInfo = Session.get('tagInfo');
    if (tagInfo && tagInfo.totalCount) {
      return tagInfo.totalCount;
    }
    else {
      return 0;
    }
  },
  numUniqueUsers: function () {
    var tagInfo = Session.get('tagInfo');
    if (tagInfo && tagInfo.users) {
      return tagInfo.users.length;
    }
    else {
      return 0;
    }
  },
  tag: function () {
    return Session.get('tag');
  }
});

Template.input.events({
  'submit': function(event) {
    event.preventDefault();
    tag = event.target[0].value;
    Session.set('tag', tag);

    var newTagInfo = Tags.findOne({tagName: tag});
    if (!newTagInfo) {
      updateTagData()
    }
  },

  'click .close-x': function(event) {
    event.preventDefault();
    Session.set('errorMessage', '');
  }
});

Template.input.helpers({
  tag: function () {
    return Session.get('tag');
  },

  loading: function () {
    var tagInfo = Session.get('tagInfo');
    if (tagInfo && tagInfo.loading) {
      return true
    }
    else {
      return false;
    }
  },

  errorMessage: function() {
    var errorMessage = Session.get('errorMessage') || false;
    return errorMessage
  }
});

Template.users.helpers({
  tagInfo: function() {
    return Session.get('tagInfo');
  }
});

Template.users.events({
  'click .update-results': function(event) {
    event.preventDefault();
    var confirmUpdate = confirm('Recounting results will clear the current counts and recount all stats. This might take a while...');
    if (confirmUpdate) {
      updateTagData();
    }
  },

  'change .sort-by': function(event) {
    Session.set('sortOrder', event.target.value);
    getTagInfo();
  }
});
