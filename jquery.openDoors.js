;(function($) {

    var $el, elx;

    $.fn.openDoors = function(options){
        if (! this.length) return this;

        // default settings
        var defaults = {
            days: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'], // weeks day
            debbug: false, // show json in screen
            onBeforeSave: function(){},
        };

        methods.options = $.extend(true, {}, defaults, options);

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
            this._bindActivePartTime(); // active part time hours
            this._bindSelectDay(); // click on a day
            this._bindSelectAllDays(); // select all days
            this._bindReset(); // reset
            this._bindSubmit(); // submit form
            this._checkSubmitStatus(); // check id submit button can be enable
        },

        // render the form html view
        renderForm: function(){
            var tpl = '', pattern = '(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){1}';
            tpl += '<div class="hours-care">';
            tpl +=     '<form>';
            tpl +=         '<div class="head">';
            tpl +=             '<input type="text" class="i1" placeholder="hh:mm" required pattern="'+pattern+'"> a <input type="text" class="i2" placeholder="hh:mm" required pattern="'+pattern+'">';
            tpl +=             '<input class="part-check" type="checkbox">';
            tpl +=             '<input type="text" class="i3" placeholder="hh:mm" disabled="disabled" required pattern="'+pattern+'"> a <input type="text" class="i4" placeholder="hh:mm" disabled="disabled" required pattern="'+pattern+'">';
            tpl +=         '</div>';
            tpl +=         '<ul class="days"><li><a href="#">'+this.options.days.join('</a></li><li><a href="#">')+'</a></li></ul>';
            tpl +=         '<div class="foot">';
            tpl +=             '<span><input type="checkbox" class="select-all">Seleccionar todos</span>';
            tpl +=             '<input type="submit" value="Guardar"><input type="reset" value="Cancelar">';
            tpl +=         '</div>';
            tpl +=         '<input type="hidden" name="h'+elx+'">';
            tpl +=     '</form>';
            tpl +=     methods.options.debbug ? '<div class="json"></div>' : '';
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
                $el.find('.i3, .i4').attr('disabled', 'disabled');
            });
        },

        // submit form
        _bindSubmit: function(callback){
            $el.find('form').on('submit', function(event) {
                event.preventDefault();
                $days = $el.find('.days .active');
                if ($days.length) { // check if selected any day
                    var res = {}, day = '', input = $el.find('.i1, .i2, .i3, .i4'); // vars declare
                    res.days = []; // days array
                    res.first = {}; // hours

                    // set first time
                    res.first.from = input[0].value; // hours from
                    res.first.to = input[1].value; // hours to
                    $days.each(function(index, el){
                        day = $(el).text();
                        res.days.push(day);
                    });

                    // check part time status
                    if ( $el.find('.part-check').is(':checked') ) {
                        res.last = {}; // json declare
                        res.last.from = input[2].value;
                        res.last.to = input[3].value;
                    }

                    res.id = methods.result.length; // generate id

                    methods.result.push(res); // save in this object methods.results

                    var stringify = JSON.stringify(res),
                        $hidden = $el.find('input[name=h'+elx+']'), // get current value
                        currentVal = $hidden.val();

                    currentVal ? $hidden.val(currentVal+','+stringify) : $hidden.val(stringify); // value in hidden input
                    if (methods.options.debbug) $el.find('.json').html(stringify); // output code
                    $el.find('.hours-care').prepend( methods.renderHours(res) ); // render days and hours
                    methods._bindRemove(); // remove item
                    $el.find('input[type="reset"]').trigger('click'); // trigger reset

                    // callback
                    methods.options.onBeforeSave.call();
                } else {
                    alert('Please, select a day');
                }
            });
        },

        // check if submit can be enable
        _checkSubmitStatus: function(){
            var i = $el.find('.i1, .i2');
            // console.log(i[0].value, i[1].value);
        },

        // render table when save is clicked
        renderHours: function(json){
            var tpl = '';
            tpl += '<div class="days-hours">';
            tpl +=     json.days.join(', ')+': '+json.first.from+' - '+json.first.to;
            tpl +=     json.last ? ' &amp; '+json.last.from+' - '+json.last.to : '';
            tpl +=     '<a href="#" class="remove" data-id="'+json.id+'">x</a>';
            tpl += '</div>';
            return tpl;
        },

        // remove items from renderHours
        _bindRemove: function(){
            $el.find('.remove').on('click', function(event) {
                event.preventDefault();
                var id = $(this).data('id'), aux = []; // declare
                $.each(methods.result, function(index, obj) {
                    if (obj.id != id) aux.push(obj);
                });
                methods.result = aux; // replace new json
                $(this).parent('.days-hours').remove(); // remove item
                $el.find('input[name=h'+elx+']').val( JSON.stringify(aux) ); // replace stringify in hidden value
            });
        },

        result: [], // partial json days hours

    };

})(jQuery);