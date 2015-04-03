import Ember from 'ember';

export default Ember.View.extend({
  templateName: function() {
    var view = 'grid';
    if (this.get('controller.view')) {
      view = this.get('controller.view');
    }
    return 'containers-'+view;
 
  }.property('controller.view'),

  viewChanged: function() {
    this.rerender();
  }.observes('controller.view'),

});
