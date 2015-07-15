Tags = new Mongo.Collection('tags');

Helpers = {
  sortUsers: function(users) {
    var userProperty, order, sortOrder;
    if (Meteor.isClient) {
      sortOrder = Session.get('sortOrder')
    }

    switch (sortOrder) {
      case 'postCountAsc':
        userProperty = 'count';
        order = 1;
        break;
      case 'followersCountDesc':
        userProperty = 'followers';
        order = -1;
        break;
      case 'followersCountAsc':
        userProperty = 'followers';
        order = 1;
        break;
      default:
        userProperty = 'count';
        order = -1;
    }

    var sortedUsers = _.sortBy(users, function(user) {
      return user[userProperty] * order;
    });

    return sortedUsers;
  }
}
