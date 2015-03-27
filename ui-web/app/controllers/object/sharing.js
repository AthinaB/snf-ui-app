import ObjectController from '../object';

export default ObjectController.extend({

  usersExtended: undefined,
  allUsersValid: false,
  cleanUserInput: true,

  init: function() {
    this.set('usersExtended', []);
    this._super();
  },

  areUsersValid: function() {
    var allUsersValid = this.get('usersExtended').every(function(user, index) {
      return user.get('status') === 'success';
    });
    if(this.get('usersExtended').get('length')) {
      this.set('allUsersValid', allUsersValid);
    }
    else {
      this.set('allUsersValid', false);
    }

  }.observes('usersExtended.@each', 'usersExtended.@each.status'),

  freezeCreation: function() {

    var allUsersValid = this.get('allUsersValid');
    var cleanUserInput = this.get('cleanUserInput');

    return !(allUsersValid && cleanUserInput);
  }.property('allUsersValid', 'cleanUserInput'),

  isPublic: false,

  setPublic: function(){
    var isPublic = this.get('model').get('public_link')? true: false;
    this.set('isPublic', isPublic);
  }.observes('public_link'),

  isShared: function(){
    return this.get('model').get('sharing')? true: false;
  }.property('model.sharing'),

  // returns True if the object is privately shared with everyone
  isSharedAll: function(){
    return this.get('isShared') && this.get('model').get('sharing').indexOf('*') > 0;
  }.property('model.sharing'),

  watchGroup: function(){
    var selectedGroup = this.get('selectedGroup');
    if (selectedGroup) {
      this.send('shareWithGroup', selectedGroup);
    }
  }.observes('selectedGroup'),


  // If the object is shared with individual users, it includes the user
  // to the shared_with list.
  // If the object is shared with group, it sets as display_name the group's 
  // name and if it is shared with all, it sets the display_name to a more 
  // verbose version of 'all' 
  shared_with_list: function(){
    var self = this;
    var shared_with = this.get('model').get('shared_users');
    _.each(shared_with, function(s){
      if (s.type === 'user') {
        s.user = self.store.find('user', s.id)
      } else if (s.type === 'all'){
        s.display_name = 'All Pithos users';
      } else if (s.type === 'group') {
        s.display_name = s.id.split(':')[1];
      }
    });
      
    return shared_with;
  }.property('shared_users.@each'),

  /**
   * Ugly function that converts model's  
   * `shared_users` list to a `sharing` string
   *
   * @method shared_users_to_sharing
   * @param shared_users {Array}
   * @return sharing {string} 
   */

  shared_users_to_sharing: function(shared_users){
    var read_users = _.filter(shared_users, function (el ) { return el.permission === 'read';}); 
    var write_users = _.filter(shared_users, function (el ) { return el.permission === 'write';}); 
    var read = null;
    var write = null;
    if (read_users.length >0 ) {
      var reads_arr = [];
      read_users.forEach(function(el){
        reads_arr.push(el.id);
      });
      read = 'read='+ reads_arr.join(',');
    }
    if (write_users.length >0 ) {
      var write_arr = [];
      write_users.forEach(function(el){
        write_arr.push(el.id);
      });
      write = 'write='+ write_arr.join(',');
    }
    var res = [];
    if (read) { res.push(read); }
    if (write) { res.push(write); }
    return res.join(';');
  },

  watchPublic: function(){
    this.send('togglePublic');
  }.observes('isPublic'),

  actions: {
    addUser: function(user) {
      var usersExtended = this.get('usersExtended');
      var notInserted = !usersExtended.findBy('email', user.email);
      var notShared = true;
      var temp = [];
      var self = this;

      var usersShared = this.get('shared_with_list').filterBy('type', 'user').map(function(item) {
        return item.user;
      });

      if(usersShared.get('length') !==0) {
        notShared = !usersShared.findBy('email', user.email);
      }

      if(notInserted && notShared) {
        var userExtended = Ember.Object.create({
          email: user.email,
          status: user.status,
          errorMsg: user.errorMsg,
        });

        this.get('usersExtended').pushObject(userExtended)

        if(user.status !== 'error') {
          this.send('findUser', user.email);
        }
      }
    },

    updateUser: function(email, data) {

      for(var prop in data) {
        this.get('usersExtended').findBy('email', email).set(prop, data[prop]);
      }

    },

    removeUser: function(email) {

      var user = this.get('usersExtended').findBy('email', email);

      this.get('usersExtended').removeObject(user);

    },

    findUser: function(email) {

      var self = this;
      var userEmail = 'email='+email;

      this.store.find('user', userEmail).then(function(user) {

        var userExtended = self.get('usersExtended').findBy('email', email);

          if(userExtended) {
            self.send('updateUser', email, {uuid: user.get('uuid'), status: 'success'});
          }
    },function(error) {

        var userExtended = self.get('usersExtended').findBy('email', email);

          if(userExtended) {
            self.send('updateUser', email, {uuid: undefined, status: 'error', 'errorMsg': 'Not found'});
          }
      });
    },

    togglePublic: function(){
      var object = this.get('model');
      this.store.setPublic(object, this.get('isPublic')).then(function(data){
        object.set('public_link', data);
      });
    },

    togglePermission: function(param){
      var object = this.get('model');
      var u_arr = object.get('shared_users');
      _.map(u_arr, function(el){
        if (el.id === param.name) {
          el.permission = param.value;
        }
      });
      var sharing = this.shared_users_to_sharing(u_arr);
      this.store.setSharing(object, sharing);
    },

    removeUserFromShare: function(id){
      var self = this;
      var object = this.get('model');
      var u_arr = object.get('shared_users');

      var u_arr_new = _.reject(u_arr, function(el) {
        return el.id === id;
      });

      var onSuccess = function() {
        object.set('sharing', sharing);
      };

      var onFail = function(reason){
        self.send('showActionFail', reason);
      };


      var sharing = this.shared_users_to_sharing(u_arr_new);
      this.store.setSharing(object, sharing).then(onSuccess, onFail);
    },

    removePrivateSharing: function(){
      var self = this;
      var object = this.get('model');
      var onSuccess = function() {
        object.set('shared_users', []);
        object.set('sharing', null);
      };

      var onFail = function(reason){
        self.send('showActionFail', reason);
      };
      this.store.setSharing(object, '').then(onSuccess, onFail);
    },

    shareWithAll: function(){
      var self = this;
      var object = this.get('model');
        
      var shared_users = _.reject(object.get('shared_users'), function(el){
        return el.permission === 'read';
      });
      shared_users.push({
        'id': '*',
        'type': 'all',
        'permission': 'read'
      });

      var onSuccess = function() {
        object.set('sharing', sharing);
      };

      var onFail = function(reason){
        self.send('showActionFail', reason);
      };

      var sharing = this.shared_users_to_sharing(shared_users);
      this.store.setSharing(object, sharing).then(onSuccess, onFail); 
    },

    shareWithUsers: function(){
      if(!this.get('freezeCreation')) {
        var self = this;
        var object = this.get('model');
        var uuids = this.get('usersExtended').mapBy('uuid');
        var u_arr = object.get('shared_users');
        var sharing;


        var onSuccess = function(res) {
          self.set('emails', '');
          object.set('sharing', sharing);
        };

        var onFail = function(reason){
          self.send('showActionFail', reason);
        };

        self.store.filter('user', function(user) {
          var id = user.get('id');
          if(uuids.indexOf(id) !== -1) {
            return user;
          }
        }).then(function(newUsers) {
          newUsers.forEach(function(user){

            u_arr.pushObject({
              'id': user.get('id'),
              'permission': 'read',
              'type': 'user'
            });
          });

          sharing = self.shared_users_to_sharing(u_arr);
          self.store.setSharing(object, sharing).then(onSuccess, onFail);
        });
      }
    },

    shareWithGroup: function(group){
      var self = this;
      var object = this.get('model');
      var u_arr = object.get('shared_users');
      var shared_with_list = this.get('shared_with_list');

      var onSuccess = function(res) {
        self.set('selectedGroup', null);
        object.set('sharing', sharing);
      };

      var onFail = function(reason){
        self.send('showActionFail', reason);
      };

      // if the object is already shared with this group return
      var group_arr = _.pluck(shared_with_list, 'display_name');
      if (_.contains(group_arr, group.get('name'))) {
        return;
      }

      u_arr.pushObject ({
        'id': this.get('settings').get('uuid')+':'+group.get('id'), 
        'permission': 'read',
        'type': 'group'
      });

      var sharing = this.shared_users_to_sharing(u_arr);
      this.store.setSharing(object, sharing).then(onSuccess, onFail); 
    }

  }
});
