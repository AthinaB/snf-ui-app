import Ember from 'ember';

export default Ember.Route.extend({

  templateName: 'loading/loading',

  setupController: function(controller, model) {
    var msg = [
      'Go grab a coffee!',
      'You look cute today...<br>You really do!',
      'What a beautiful day :)',
      'We\'ve missed you :)',
      'Just wanted to say "Hi!"',
      'Enjoy!',
      'Come back soon!',
      'Good to see you again!',
      'It\'s never too late to start over :)',
      'Good things<br>come to those who wait',
      'How long would someone wait<br>to call it waiting?'
    ];
    controller.set('happy-msg', msg[_.random(0, msg.length - 1)]);
  }
});
