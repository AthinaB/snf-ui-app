import Ember from 'ember';

export default Ember.View.extend({
	classNames: ['reveal-modal'],
	classNameBindings: ['templateCls'],
	attributeBindings: ['data-reveal'],
	'data-reveal': 'true',
	layoutName: 'dialog-wrapper',


  /*  Assign a class to each dialog
  * Available classes:
  * tiny: Set the width to 30%.
  * small: Set the width to 40%.
  * medium: Set the width to 60%.
  * large: Set the width to 70%. (default)
  * xlarge: Set the width to 95%.
  * full: Set the width and height to 100%.
  */
  templateCls: function(){
    var clsMap = {
      'dialogs.create-dir': 'small',
      'dialogs.confirm-simple': 'small', 
      'dialogs.feedback': 'medium',
      'dialogs.move': 'small',
      'dialogs.restore': 'medium',
      'dialogs.create-container': 'small',
      'dialogs.groups': 'medium',
    }
    return clsMap[this.get('renderedName')];
  }.property('renderedName'),

	revealDialog: function() {
		this.$().foundation('reveal', 'open');
	}.on('didInsertElement'),

	closeDialog: function() {
		var closeDialog = this.get('controller').get('closeDialog');
		if(closeDialog) {
			this.$().foundation('reveal', 'close');
			this.get('controller').set('closeDialog', false)
		}
	}.observes('controller.closeDialog'),

	didInsertElement: function() {

		this._super();

		var self = this;

		// templateName could be: dialogs.error or dialogs.feedback etc
		var templateName = this.get('renderedName');

		// type is used to disconnect the dialog from the correct outlet
		var type = templateName.replace('dialogs.', '');

		$(document).on('closed.fndtn.reveal', '[data-reveal]', function () {

			// this bubbles up to application route
			self.get('controller').send('removeDialog', type);
			if(self.get('controller').get('name') === 'groups') {
				self.get('controller').set('usersExtended', []);
			}
		});

    $(document).on('opened.fndtn.reveal', '[data-reveal]', function () {
      var dialog = self.$();
      dialog.find('[autofocus]').focus();
    });
    
    $('.close-modal').on('click', function(){
		self.$().foundation('reveal', 'close');
    });

	},
	/*
	 * Every event handler that has bound with the current view should be removed
	 * before the view gets destroyed
	 */
	willDestroy: function() {
    $(document).find('.reveal-modal-bg').remove();
    $(document).off('click', '[data-reveal] .slide-btn');
    $(document).off('closed.fndtn.reveal', '[data-reveal]');
    $(document).off('opened.fndtn.reveal', '[data-reveal]');
		this._super();
	},

	actions: {
		/*
		 * slide action slides down a closed areaand focuses the 1st input in it
		 * or if the area is open, it slides it up and send to the corresponting
		 * controller the action reset
		*/
		slide: function(controller, areaID) {
			var $area = this.$('.slide-container[data-area-id='+areaID+']');
			$area.toggleClass('open');
			var toOpen = $area.hasClass('open');

			if(toOpen) {
				$area.find('.slide-me').stop().slideDown('slow', function() {
					$area.find('input:first').focus();
				});
			}
			else {
				$area.find('.slide-me').stop().slideUp('slow', function() {
					controller.send('reset');
				});
			}

		}
	},


	// Use in the confirmSimple dialog
	title: function() {
		var action = this.get('controller').get('actionToPerform');
		return this.get(action).title;
	}.property(),

	actionVerb: function() {
		var action = this.get('controller').get('actionToPerform');
		return (this.get(action).action_verb);
	}.property(),


	// Actions metadata
	emptyAndDelete: {
		title: 'Delete Container',
		action_verb: 'Delete'
	},
	emptyContainer: {
		title: "Empty Container",
		action_verb: 'Empty'
	},
	deleteObject: {
		title: 'Delete Object',
		action_verb: 'Delete'
	},
	deleteGroup: {
		title: 'Delete Group',
		action_verb: 'Delete'
	}


});
