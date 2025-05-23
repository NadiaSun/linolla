function initFormCalendars($container) {
	var formCalendars = $container.find('.s3wm-datepicker-calendar');
	var formCalendarsInterval = $container.find('.s3wm-datepicker-calendar_interval');

	if (!formCalendars.length && !formCalendarsInterval.length) {
		var siteLang = $('html').attr('lang') !== 'ru' ? 'en' : 'ru';
		// Init form calendars
		$container.find('.init-calendar').each(function(){
			new tcal({
				'controlname':this.id,
				'place':this.parentNode,
				'lang': siteLang
			});

		});

		// Init form calendar intervals
		$container.find('.init-calendar-interval').each(function(){
			for(var j=0; j<2; ++j){
				var e = f_getElement(this.id + '['+j+']');
				new tcal({
					'controlname':e.id,
					'place':e.parentNode,
					'lang': siteLang,
					'intervalpair':[
						this.id + '[0]',
						this.id + '[1]'
					],
					'intervalupdatecont' : this.id
				});
			}
		});
	}
	if (formCalendars.length && $.datepicker) {
		formCalendars.each(function(){
			var thisInputCalendar = $(this);

			if (thisInputCalendar.hasClass('hasDatepicker')) {return false;}

			thisInputCalendar.datepicker({
				changeMonth: true,
				changeYear: true
			});
		});
	}
	if (formCalendarsInterval.length && $.datepicker) {
		formCalendarsInterval.each(function(){
			var thisCalendarInterval = $(this);

			if (thisCalendarInterval.hasClass('calendar-init')) {return false;}

			thisCalendarInterval.addClass('calendar-init');

			var calendarWrap = thisCalendarInterval.closest('.form-calendar_interval,.form_calendar_interval');
			var inputInterval = calendarWrap.find('[type="text"]');

			inputInterval.eq(0).datepicker({
				changeMonth: true,
				changeYear: true,
				onClose: function(selectedDate) {
					inputInterval.eq(1).datepicker("option", "minDate", selectedDate);
				}
			});
			inputInterval.eq(1).datepicker({
				changeMonth: true,
				changeYear: true,
				onClose: function(selectedDate) {
					inputInterval.eq(0).datepicker("option", "maxDate", selectedDate);
					thisCalendarInterval.val(inputInterval.eq(0).val() + ' - ' + inputInterval.eq(1).val());
				}
			});
		});
	}
}

function fixFormId($container) {
	if ((match = $container.data('api-url').match(/form_id[^=]?=(\d+)/)) && match != null && typeof match[1] !== undefined) {
		$container.find('[name="form_id"]').val(match[1]);
	};
}

var s3From = {
	init: function() {
		this.initForms();
	},
	initForms: function(parent, callback, from_response) {
		var self = this;

		if (!parent) parent = document;
		if ($(parent)[0] === document || !$(parent).is('[data-api-url][data-api-type=form]')) {
			parent = $(parent).find('[data-api-url][data-api-type=form]');
		}

		if (!callback) {
			callback = typeof parent.data('callback') === 'function' ? parent.data('callback') : eval(parent.data('callback'));
		}

		$(parent).each(function() {
			var $container = $(this);
			var $form = $container.is("form") ? $container : $container.find("form");
			fixFormId($container);
			if ($container.data('s3form_inited')) {
				return;
			}
			if ($form.length) {
				$form.submit(function() {
					$.post($container.data('api-url'), $form.serialize(), res);
					return false;
				});
			} else if (!from_response) {
				$.getJSON($container.data('api-url'), null, res);
			}

			initFormCalendars($form);

			$container.data('s3form_inited', true);

			function res(response) {
				if (response.result.success && response.result.redirect_url) {
					document.location = response.result.redirect_url;
				} else if (response.result && response.result.html) {
					var uploaders_inits = '';
					var scripts = response.result.html.match(/<script[^>]*>[^<]*newSWFU[^<]*<\/script>/gm);
					if (scripts) {
						for (var i = 0; i < scripts.length; i++) {
							uploaders_inits += scripts[i].replace(/<script[^>]*>([^<]+)<\/script>/, "$1");
						}
					}
					var $replacement = $(response.result.html.replace(/[\r\n]/g, '').replace(/<script[^>]*>.*?<\/script>/g, ''));
					if (!$($replacement).is('[data-api-url][data-api-type=form]')) {
						$replacement = $($replacement).find('[data-api-url][data-api-type=form]');
					}
					$container.replaceWith($replacement);
					$container = $replacement;
					
					if (response.result && response.result.success && typeof lpc_template !== 'undefined'){
            				$container.closest(`.lpc-wrap`).find(`[class$=__title-wrap]`).remove();
        			}
					
					var $captcha = $container.find('input[name=_cn]');
					if ($captcha.length) {
						$.getScript('http:///static/captcha.js?2', function() {
							var $d = $container.find("[id^=s3_captcha_cn]");
							mgCaptcha.draw("/my/s3/captcha/get.php", ($d.length ? $d.get(0) : null));
						});
					}

					var $uploads = $container.find('input[type="hidden"][id^="hidUploadField"]');

					if ($uploads.length) {
						if (typeof window['newSWFU'] !== 'function') {
							$.getScript('/shared/s3/plupload/plupload.all.pack.js', function() {
								inituploaders();
							});
						} else {
							inituploaders();
						}
					}

					function inituploaders() {
						if (uploaders_inits) {
							eval(uploaders_inits);
						}
					}

					self.initForms($container, callback, true);

					if (typeof callback === 'function') {
						callback();
					}
				}
			}
		})
	}
};

var s3PopupForm = {
	init: function() {
		this.initPopupForms();
	},
	initPopupForms: function(parent, callback) {
		if (typeof myo) {
			if (!parent) parent = document;
			if ($(parent)[0] === document || !$(parent).is('[data-api-url][data-api-type=popup-form]')) {
				parent = $(parent).find('[data-api-url][data-api-type=popup-form]');
			}
			if (parent.data('api-url')) {
				fixFormId(parent);
				parent = parent.filter(function() {
					return !$(this).data('s3form_inited');
				});
				if (!callback) {
					callback = typeof parent.data('callback') === 'function' ? parent.data('callback') : eval(parent.data('callback'));
				}
				parent.data('s3form_inited', true).click(function(e) {
					var $this = $(this);
					if (myo.show) {
						myo.show({
							html: '<div data-api-url="' + $this.data('api-url') + '" data-api-type="form"></div>',
							clas: $(this).data('wr-class'),
							afterOpen: function() {
								var win = this;
								win.loadDiv.show();
								s3From.initForms(win.bodyDiv.find('>div[data-api-type]'), function() {
									win.loadDiv.hide();
									if (typeof callback === 'function') {
										callback();
									}
								});
							}
						});
					} else if (myo.open) {
						myo.open({
							html: '<div data-api-url="' + $this.data('api-url') + '" data-api-type="form"></div>',
							clas: $(this).data('wr-class'),
							afterOpen: function() {
								var win = this;
								win.loadDiv.show();
								s3From.initForms(win.bodyDiv.find('>div[data-api-type]'), function() {
									win.loadDiv.hide();
									if (typeof callback === 'function') {
										callback();
									}
								});
							}
						});
					}
					e.preventDefault();
					return false;
				})
			}
		}
	}
};

$(function() {
	s3PopupForm.init();
	s3From.init();
});