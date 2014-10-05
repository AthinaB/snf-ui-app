import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  project: DS.belongsTo('project', {async:true}),
  objects: DS.hasMany('object', {async:true}),
  bytes: DS.attr('number'),
  count: DS.attr('string'),
});
