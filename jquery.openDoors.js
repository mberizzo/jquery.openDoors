;(function($) {
    'use strict';

    var methods = {
        init: function(options){
            return this.each(function(index){
                this.self = $(this);
                this.elx = index;

                methods.opt = $.extend(true, {}, $.fn.openDoors.defaults, options);

                var render = methods.renderForm.call(this); // form render

                // load view in element
                this.self.html(render);

                // check if need render something
                if (methods.opt.firstRenderThis) {
                    methods.result = JSON.parse(methods.opt.firstRenderThis);
                    methods.renderHours.call(this);
                    if (methods.opt.readOnly) return;
                    methods._updateHiddenVal.call(this); // complete hidden field
                }

                methods._bindActivePartTime.call(this); // active part time hours
                methods._bindSelectDay.call(this); // click on a day
                methods._bindSelectAllDays.call(this); // select all days
                methods._bindReset.call(this); // reset
                methods._bindSubmit.call(this); // submit form
                methods._checkSubmitStatus.call(this); // check id submit button can be enable                
            });
        },

        /**
         * Render the form html view
         */
        renderForm: function(){
            var tpl = '';
            tpl += '<div class="open-doors">';
            tpl +=     '<div class="render-result"></div>';
            if (! methods.opt.readOnly) {
                tpl +=     '<div class="head">';
                tpl +=         '<input type="time" class="i1" placeholder="hh:mm"> a <input type="time" class="i2" placeholder="hh:mm">';
                tpl +=         '<input class="part-check" type="checkbox">';
                tpl +=         '<input type="time" class="i3" placeholder="hh:mm" disabled="disabled"> a <input type="time" class="i4" placeholder="hh:mm" disabled="disabled">';
                tpl +=     '</div>';
                tpl +=     '<ul class="days"><li><a href="#">'+methods.opt.days.join('</a></li><li><a href="#">')+'</a></li></ul>';
                tpl +=     '<div class="foot">';
                tpl +=         '<span><input type="checkbox" id="h'+this.elx+'" class="select-all"><label for="h'+this.elx+'">Seleccionar todos</label></span>';
                tpl +=         '<input type="submit" value="Guardar"><input type="button" class="reset" value="Cancelar">';
                tpl +=     '</div>';
                tpl +=     '<input type="hidden" name="h'+this.elx+'">';
            }
            tpl += '</div>';
            return tpl;
        },

        // click on checkbox that active part time inputs
        _bindActivePartTime: function(){
            var that = this.self;
            $('.part-check').on('change', function(){
                that.find('.i3, .i4').attr('disabled', this.defaultChecked);
                this.defaultChecked = ! this.defaultChecked;
            });
        },

        // select one day
        _bindSelectDay: function(){
            var that = this.self;
            that.find('.days a').on('click', function(event){
                event.preventDefault();
                $(this).hasClass('active') ? $(this).removeClass('active') : $(this).addClass('active');
            });
        },

        // select all days
        _bindSelectAllDays: function(){
            var that = this.self;
            that.find('.select-all').on('change', function(){
                var $days = that.find('.days a');
                this.defaultChecked ? $days.removeClass('active') : $days.addClass('active');
                this.defaultChecked = ! this.defaultChecked;
            });
        },

        // reset
        _bindReset: function(){
            var that = this.self;
            that.find('input.reset').on('click', function() {
                that.find('.days a').removeClass('active');
                that.find('.select-all, .part-check').removeAttr('checked');
                that.find('.i1, .i2, .i3, .i4').val('');
                that.find('.i3, .i4').attr('disabled', 'disabled');
            });
        },

        // submit form
        _bindSubmit: function(){
            var
                self       = this,
                that       = this.self,
                $btnSubmit = that.find('input[type="submit"]');

            $btnSubmit.on('click', function(event) {
                event.preventDefault();

                var $selectedDays = that.find('.days .active');

                // check if selected some day
                if ($selectedDays.length) {
                    var
                        aux   = {},
                        day   = '',
                        input = that.find('.i1, .i2, .i3, .i4');

                    // set first time
                    aux.first = {}; // is obj
                    aux.first.from = input[0].value; // hours from
                    aux.first.to = input[1].value; // hours to
                    if (! utils.validateTime(aux)) return false; // validate time

                    // set last time
                    if ( that.find('.part-check').is(':checked') ) { // check part time status
                        aux.last = {}; // is obj
                        aux.last.from = input[2].value; // hours from
                        aux.last.to = input[3].value; // hours to
                        if (! utils.validateTime(aux, true)) return false; // validate time
                    }

                    aux.days = []; // days array

                    $selectedDays.each(function(index, el){
                        day = $(el).text();
                        aux.days.push(day);
                    });

                    if (! utils.validateExists(aux)) return false; // validate if this hours range exists

                    methods.result[methods.result.length] = aux; // generate id

                    methods._updateHiddenVal.call(self); // complete hidden field
                    methods.renderHours.call(self); // render days and hours

                    that.find('input.reset').trigger('click'); // reset

                    methods.opt.onAfterSave.call(); // callback
                } else {
                    alert('Please, select a day');
                    return false;
                }
            });
        },

        // check if submit can be enable
        _checkSubmitStatus: function(){
            var that = this.self;
            var i = that.find('.i1, .i2');
            // console.log(i[0].value, i[1].value);
        },

        // render table when save is clicked
        renderHours: function(){
            var
                self   = this,
                that   = this.self,
                tpl    = '',
                render = '';

            $.each(methods.result, function(id, json) {
                tpl += '<div class="days-hours">';
                tpl +=     utils.formatDays(json['days'])+': '+json['first']['from']+' - '+json['first']['to'];
                tpl +=     json['last']? ' &amp; '+json['last']['from']+' - '+json['last']['to'] : '';
                tpl +=     methods.opt.readOnly ? '' : '<a href="#" class="remove" data-id="'+id+'">x</a>';
                tpl += '</div>';
                render += tpl;
                tpl = '';
            });

            // render days and hours
            that.find('.render-result').html(render);

            // bind remove item
            methods._bindRemove.call(self);
        },

        // remove items from renderHours
        _bindRemove: function(){
            var
                self = this,
                that = this.self;

            that.find('.remove').on('click', function(event) {
                event.preventDefault();
                var id = $(this).data('id'), aux = [], count = 0; // declare
                $.each(methods.result, function(key, obj) {
                    if (key != id) {
                        aux[count] = obj;
                        count++; // is to avoid null indexes
                    }
                });
                methods.result = aux; // replace new json
                methods.renderHours.call(self); // render again, because refresh the id from method.result
                methods._updateHiddenVal.call(self); // update value
            });
        },

        // update field hidden when submit or render by options.firstRenderThis
        _updateHiddenVal: function(){
            var
                that      = this.self,
                elx       = this.elx,
                $hidden   = that.find('input[name=h'+elx+']'), // get hidden
                hiddenVal = methods.result.length ? JSON.stringify(methods.result) : ''; // value in hidden input

            // set value
            $hidden.val(hiddenVal);
        },

        result: [], // partial json days hours

    };

    var utils = {
        /**
         * Format days
         * Get [lun, mar, mie, sab]. Return lun-mie, sab
         */
        formatDays: function(json){
            var
                aux     = '',
                key     = 0,
                compare = methods.opt.days,
                length  = json.length,
                range   = [],
                getKey  = function(array, value){
                    for (var i = 0; i < array.length; i++) {
                        if (array[i] == value) return i;
                    }
                };

            for (var i = 0; i < length; i++) {
                key = parseInt( getKey(compare, json[i]) );
                if ( (json[i+1] == compare[key+1]) && (json[i+1] != undefined) ) {
                    aux += json[i]+'-';
                } else if ( (json[i-1] == compare[key-1]) && (json[i-1] != undefined) ) {
                    aux += json[i]+',';
                } else {
                    aux += json[i]+',';
                }
            }

            aux = aux.substr(0, aux.length-1);

            range = aux.split(',');

            $.each(range, function(index, val) {
                val = val.split('-');
                range[index] = val.length > 1 ? val[0]+'-'+ val[val.length-1] : val[0];
            });

            return range.join(', ');
        },

        setError: function($selector){
            return alert('error');
        },

        /**
         * Validate if time are posible
         */
        validateTime: function(time, last){
            var patt = new RegExp('(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){1}'),
                valid = false;
            if (last === undefined) {
                // first time
                if (time.first.from.match(patt) === null) {
                    utils.setError();
                } else if (time.first.to.match(patt) === null || time.first.to <= time.first.from) {
                    utils.setError();
                } else {
                    valid = true;
                }
            } else {
                // last time
                if (time.last.from.match(patt) === null || time.last.from <= time.first.to) {
                    utils.setError();
                } else if (time.last.to.match(patt) === null || time.last.to <= time.last.from) {
                    utils.setError();
                } else {
                    valid = true;
                }
            }
            return valid;
        },

        /**
         * Validate collision, if exists
         */
        validateExists: function(json){
            var compare = methods.result;
            if (compare.length) {
                for (var i = 0; i < compare.length; i++) {
                    // search day
                    for (var x = 0; x < compare[i].days.length; x++) {
                        // if day in array
                        if ($.inArray(compare[i].days[x], json.days) > -1) {
                            // verify hours
                            if ( (json.first.from >= compare[i].first.from &&
                                 json.first.from <= compare[i].first.to) ||
                                 (json.first.to >= compare[i].first.from &&
                                 json.first.to <= compare[i].first.to) ) {
                                alert('El 1er rango de horario se superpone');
                                return false;
                            } else if ( (json.last !== undefined &&
                                        compare[i].last !== undefined) &&
                                        ((json.last.from >= compare[i].last.from &&
                                        json.last.from <= compare[i].last.to) ||
                                        (json.last.to >= compare[i].last.from &&
                                        json.last.to <= compare[i].last.to)) ) {
                                alert('El 2do rango de horario se superpone');
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        },
    };

    $.fn.openDoors = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist!');
        }
    };

    $.fn.openDoors.defaults = {
        days: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'], // weeks day
        firstRenderThis: false, // string json format
        readOnly: false,
        onAfterSave: function(){},
    };

})(jQuery);