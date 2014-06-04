;(function($) {

    var $el, elx;

    $.fn.openDoors = function(options){
        if (! this.length) return this;

        // default settings
        var defaults = {
            days: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'], // weeks day
            debbug: false, // show json in screen
            firstRenderThis: false, // string json format
            onAfterSave: function(newVal){},
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

            // check if need render something
            if (this.options.firstRenderThis) {
                var json = JSON.parse(this.options.firstRenderThis);
                this.result = json;
                this.renderHours();
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
            tpl +=     '<div class="head">';
            tpl +=         '<input type="text" class="i1" placeholder="hh:mm"> a <input type="text" class="i2" placeholder="hh:mm">';
            tpl +=         '<input class="part-check" type="checkbox">';
            tpl +=         '<input type="text" class="i3" placeholder="hh:mm" disabled="disabled"> a <input type="text" class="i4" placeholder="hh:mm" disabled="disabled">';
            tpl +=     '</div>';
            tpl +=     '<ul class="days"><li><a href="#">'+this.options.days.join('</a></li><li><a href="#">')+'</a></li></ul>';
            tpl +=     '<div class="foot">';
            tpl +=         '<span><input type="checkbox" id="h'+elx+'" class="select-all"><label for="h'+elx+'">Seleccionar todos</label></span>';
            tpl +=         '<input type="submit" value="Guardar"><input type="reset" value="Cancelar">';
            tpl +=     '</div>';
            tpl +=     '<input type="hidden" name="h'+elx+'">';
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
                if ($days.length) { // check if selected any day
                    var response = {}, aux = {}, day = '', input = $el.find('.i1, .i2, .i3, .i4'); // vars declare

                    // validate inputs
                    var patt = new RegExp('(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){1}'), error = false;
                    $.each([input[0], input[1]], function(index, el) {
                        if (el.value.match(patt) === null) error = true;
                    });
                    if (error) return false;

                    aux.days = []; // days array
                    aux.first = {}; // hours

                    // set first time
                    aux.first.from = input[0].value; // hours from
                    aux.first.to = input[1].value; // hours to
                    $days.each(function(index, el){
                        day = $(el).text();
                        aux.days.push(day);
                    });

                    if ( $el.find('.part-check').is(':checked') ) { // check part time status
                        // validate parts inputs
                        $.each([input[2], input[3]], function(index, el) {
                            if (el.value.match(patt) === null) error = true;
                        });
                        if (error) return false;

                        // set last time
                        aux.last = {}; // json declare
                        aux.last.from = input[2].value; // hours from
                        aux.last.to = input[3].value; // hours to
                    }

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
            var tpl = '', render = '';
            $.each(this.result, function(id, json) {
                tpl += '<div class="days-hours">';
                tpl +=     json['days'].join(', ')+': '+json['first']['from']+' - '+json['first']['to'];
                tpl +=     json['last']? ' &amp; '+json['last']['from']+' - '+json['last']['to'] : '';
                tpl +=     '<a href="#" class="remove" data-id="'+id+'">x</a>';
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

})(jQuery);