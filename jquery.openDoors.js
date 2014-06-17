;(function($) {

    var $el, elx;

    $.fn.openDoors = function(options){
        if (! this.length) return this;

        // default settings
        var defaults = {
            days: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'], // weeks day
            firstRenderThis: false, // string json format
            readOnly: false,
            onAfterSave: function(){},
        };

        methods.options = $.extend(true, {}, defaults, options);

        // replace all days, not combine
        if (options !== undefined && options.days !== undefined) {
            methods.options.days =  options.days;
        }

        this.each(function(index) {
            $el = $(this);
            elx = index;
            methods.init();
        });
    };

    var methods = {

        init: function(){
            var view = this.renderForm(); // form render
            $el.html(view); // load view in element

            // check if need render something
            if (this.options.firstRenderThis) {
                var json = JSON.parse(this.options.firstRenderThis);
                this.result = json;
                this.renderHours();
                if (this.options.readOnly) return;
                this._updateHiddenVal(); // complete hidden field
            }

            this._bindActivePartTime(); // active part time hours
            this._bindSelectDay(); // click on a day
            this._bindSelectAllDays(); // select all days
            this._bindReset(); // reset
            this._bindSubmit(); // submit form
            this._checkSubmitStatus(); // check id submit button can be enable
        },

        // render the form html view
        renderForm: function(){
            var tpl = '';
            tpl += '<div class="open-doors">';
            tpl +=     '<div class="render-result"></div>';
            if (! this.options.readOnly) {
                tpl +=     '<div class="head">';
                tpl +=         '<input autofocus type="time" class="i1" placeholder="hh:mm"> a <input type="time" class="i2" placeholder="hh:mm">';
                tpl +=         '<input class="part-check" type="checkbox">';
                tpl +=         '<input type="time" class="i3" placeholder="hh:mm" disabled="disabled"> a <input type="time" class="i4" placeholder="hh:mm" disabled="disabled">';
                tpl +=     '</div>';
                tpl +=     '<ul class="days"><li><a href="#">'+this.options.days.join('</a></li><li><a href="#">')+'</a></li></ul>';
                tpl +=     '<div class="foot">';
                tpl +=         '<span><input type="checkbox" id="h'+elx+'" class="select-all"><label for="h'+elx+'">Seleccionar todos</label></span>';
                tpl +=         '<input type="submit" value="Guardar"><input type="reset" value="Cancelar">';
                tpl +=     '</div>';
                tpl +=     '<input type="hidden" name="h'+elx+'">';
            }
            tpl += '</div>';
            return tpl;
        },

        // click on checkbox that active part time inputs
        _bindActivePartTime: function(){
            $('.part-check').on('change', function(){
                $el.find('.i3, .i4').attr('disabled', this.defaultChecked);
                this.defaultChecked = ! this.defaultChecked;
            });
        },

        // select one day
        _bindSelectDay: function(){
            $el.find('.days a').on('click', function(event){
                event.preventDefault();
                $(this).hasClass('active') ? $(this).removeClass('active') : $(this).addClass('active');
            });
        },

        // select all days
        _bindSelectAllDays: function(){
            $el.find('.select-all').on('change', function(){
                var $days = $el.find('.days a');
                this.defaultChecked ? $days.removeClass('active') : $days.addClass('active');
                this.defaultChecked = ! this.defaultChecked;
            });
        },

        // reset
        _bindReset: function(){
            $el.find('input[type="reset"]').on('click', function() {
                $el.find('.days a').removeClass('active');
                $el.find('.select-all, .part-check').removeAttr('checked');
                $el.find('.i1, .i2, .i3, .i4').val('');
                $el.find('.i3, .i4').attr('disabled', 'disabled');
            });
        },

        // submit form
        _bindSubmit: function(){
            $buttonSubmit = $el.find('input[type="submit"]');
            $buttonSubmit.on('click', function(event) {
                event.preventDefault();
                $days = $el.find('.days .active');
                if ($days.length) { // check if selected some day
                    var aux = {}, day = '', input = $el.find('.i1, .i2, .i3, .i4'); // vars declare

                    // set first time
                    aux.first = {}; // json declare
                    aux.first.from = input[0].value; // hours from
                    aux.first.to = input[1].value; // hours to
                    if (! utils.validateTime(aux)) return false; // validate time

                    // set last time
                    if ( $el.find('.part-check').is(':checked') ) { // check part time status
                        aux.last = {}; // json declare
                        aux.last.from = input[2].value; // hours from
                        aux.last.to = input[3].value; // hours to
                        if (! utils.validateTime(aux, true)) return false; // validate time
                    }


                    aux.days = []; // days array
                    $days.each(function(index, el){
                        day = $(el).text();
                        aux.days.push(day);
                    });

                    if (! utils.validateExists(aux)) return false; // validate if this hours range exists

                    methods.result[methods.result.length] = aux; // generate id

                    methods._updateHiddenVal(); // complete hidden field
                    methods.renderHours(); // render days and hours

                    $el.find('input[type="reset"]').trigger('click'); // reset

                    methods.options.onAfterSave.call(); // callback
                } else {
                    // alert('Please, select a day');
                    return false;
                }
            });
        },

        // check if submit can be enable
        _checkSubmitStatus: function(){
            var i = $el.find('.i1, .i2');
            // console.log(i[0].value, i[1].value);
        },

        // render table when save is clicked
        renderHours: function(){
            var tpl = '', render = '', readOnly = this.options.readOnly;
            $.each(this.result, function(id, json) {
                tpl += '<div class="days-hours">';
                tpl +=     utils.formatDays(json['days'])+': '+json['first']['from']+' - '+json['first']['to'];
                tpl +=     json['last']? ' &amp; '+json['last']['from']+' - '+json['last']['to'] : '';
                tpl +=     readOnly ? '' : '<a href="#" class="remove" data-id="'+id+'">x</a>';
                tpl += '</div>';
                render += tpl;
                tpl = '';
            });
            $el.find('.render-result').html(render); // render days and hours
            methods._bindRemove(); // bind remove item
        },

        // remove items from renderHours
        _bindRemove: function(){
            $el.find('.remove').on('click', function(event) {
                event.preventDefault();
                var id = $(this).data('id'), aux = [], count = 0; // declare
                $.each(methods.result, function(key, obj) {
                    if (key != id) {
                        aux[count] = obj;
                        count++; // is to avoid null indexes
                    }
                });
                methods.result = aux; // replace new json
                methods.renderHours(); // render again, because refresh the id from method.result
                methods._updateHiddenVal(); // update value
            });
        },

        // update field hidden when submit or render by options.firstRenderThis
        _updateHiddenVal: function(){
            var $hidden = $el.find('input[name=h'+elx+']'); // get hidden
            this.result.length ? $hidden.val( JSON.stringify(this.result) ) : $hidden.val(''); // value in hidden input
        },

        result: [], // partial json days hours

    };

    var utils = {
        /**
         * Format days
         * Get [lun, mar, mie, sab]. Response lun-mie, sab
         */
        formatDays: function(json){
            var aux = '',
                key = 0,
                compare = methods.options.days,
                length = json.length,
                range = [],
                getKey = function(array, value){
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

})(jQuery);