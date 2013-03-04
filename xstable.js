/**********************************************************************
 * 
 * Table component 0.1
 *
 * This component creates a 'simple table' that is accessible and has
 * caption, summary and other accessibility features. Also it supports
 * column highlighting and clickable cells out of the box to improve
 * usability.
 *
 * For complex tables e.g. with header/id relations or nested tables, you might need to tweak or use another component.
 *
 * For advanced features like sorting, paging & filtering, this component
 * may be very well used in combination with datatables.net.
 *
 * Documentation:
 * opts.rows expects an object containing array of arrays of cells (each representing a row) for example [['<td class="id">1</td>','<td class="name">Ray</td>']['<td class="id">2</td>','<td class="name">Mark</td>']]
 *
 * OR if you want to provide the row too (e.g. including classnames or other attributes), pass the TR attribute string as a second value of the row array:
 * [
 *   [
 *      ['<td class="id">1</td>','<td class="name">Ray</td>']
 *      ['<td class="id">2</td>','<td class="name">Mark</td>']
 *   ,
 *      'class="x" rel="y" tabindex="0"'
 *   ]
 * ]
 *
 * Dependencies : jQuery + Mustache template engine (http://mustache.github.com/)
 *
 * Credits: All credits go to someone who doesn't want his name mentioned
 * Author: dirkjan@degroot.in
 * Location: https://github.com/dirkjan111/xstable
 * Date: 30-05-2012
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Credits: Mustache, Mic/Pure.js
 *
 **********************************************************************/

$.grid = (function($, Mustache) {

    var BUILD = function(opts) {
	
        var optsdefaults = {
                version: '0.1',
                tableid: '',
                cssclass: '',
                summary: '',
                caption: '',
                showcaption: true,
                showhead: true,
                reservespacecaption : true,
                columnhighlight: true,
                click_enlarge: true,
                headers: '', // mandatory
                rows: '', // mandatory
                rowrel : '', // give rel to row of cell value
                thscope: 'col',
                trscope: '',
                zebra: false,
                active: false,
                onInit: $.noop,
                onError: $.noop,
                onChange: $.noop,
                onReady: $.noop,
                target: ['#y','prepend'] // the table will be added into a div with this id, use jquery selector ['prepend','append','before','after']
        };

        opts = $.extend({}, optsdefaults, opts);

        var thead = '';
        var tbody = '';
        var cells = '';
        var caption = '';
        var colgroups = '';

        if($.isEmptyObject(opts.rows) || opts.headers.length === 0) {
            return opts.onError();
        }

        /* header cell's scope attribute to improve accessibility */
        var thscope = (typeof(opts.thscope !== "undefined") && opts.thscope !== "") ? ' scope="'+opts.thscope+'"' : "";

        /* create header cells from view */
        $.each(opts.headers, function(k,v){
            var cssclass = (typeof(v.cssclass !== "undefined") && v.cssclass !== "") ? v.cssclass+" " : "";
            var cssstring = cssclass.trim() == '' ? '' : ' class="'+cssclass.trim()+'"';
            var title_attr = ($.trim(v.title_attr) !== '') ? 'title="'+v.title_attr+'"' : '';

            var MODEL_THEAD = {
                th              :   v.title,
                cssclass        :   cssstring,
                thscope         :   thscope,
                title_attr      :   title_attr
            };

            var TEMPLATE_THEAD = '<th{{{thscope}}}{{{cssclass}}}{{{title_attr}}}>{{{th}}}</th>';
            var VIEW_THEAD = Mustache.render(TEMPLATE_THEAD,MODEL_THEAD);

            thead += VIEW_THEAD;

            if(opts.columnhighlight) {
                colgroups += '<colgroup></colgroup>';
            }
        });


        if(opts.showcaption) {
            caption = '<caption>'+opts.caption+'</caption>';
        } else {
            caption = '<caption {reservespacecaption}></caption>';
            caption = caption.replace('{reservespacecaption}', (!opts.reservespacecaption) ? 'class="hide"' : '');
        }

        /* row scope attribute to improve accessibility */
        var trscope = (typeof(opts.trscope !== "undefined") && opts.trscope !== "") ? ' scope="'+opts.trscope+'"' : "";

        /* create body rows + cells from view */
        $.each(opts.rows, function(key,value){

            var arrayLoop = $.isArray(value[0]) ? value[0] : value;

            $.each(arrayLoop, function(k,v){
                var parentCssClass = opts.headers[k].cssclass;
                var td = $(v).addClass(parentCssClass);
                var d = td.outerHTML();
                cells += d;
            });

            var MODEL_TR = {
                tr                  : cells,
                trscope             : trscope,
                attribute_string    : ($.isArray(value[0]) && typeof value[1] != 'undefined') ? value[1] : ''
            };

            var TEMPLATE_TR = '<tr{{{trscope}}} {{{attribute_string}}}>{{{tr}}}</tr>';
            var VIEW_TR = Mustache.render(TEMPLATE_TR,MODEL_TR);

            tbody += VIEW_TR;
            cells = '';
        });

        var MODEL_TABLE = {
            thead       : thead,
            caption     : caption,
            showhead    : (opts.showhead) ? '' : 'class="hide"',
            version     : opts.version,
            summary     : opts.summary,
            tableid     : opts.tableid,
            cssclass    : opts.cssclass,
            colgroups   : colgroups,
            tbody       : tbody
        };

        var TEMPLATE_TABLE = ''+
            '<table summary="{{summary}}" id="{{tableid}}" class="overview {{cssclass}}" data-version="{{version}}">'+
                '{{{colgroups}}}'+
                '{{{caption}}}'+
                '<thead {{{showhead}}}>'+
                    '<tr>{{{thead}}}</tr>'+
                '</thead>'+
                '<tbody>{{{tbody}}}</tbody>'+
            '</table>';

        var VIEW_TABLE = Mustache.render(TEMPLATE_TABLE, MODEL_TABLE);

        var target = $(opts.target[0]);

        if(opts.active) {
            switch(opts.target[1]) {
                case 'prepend' :
                    target.prepend(VIEW_TABLE);
                break;
                case 'append' :
                    target.append(VIEW_TABLE);
                break;
                case 'before' :
                    target.before(VIEW_TABLE);
                break;
                case 'after' :
                    target.after(VIEW_TABLE);
                break;
            }
        }

        if(opts.columnhighlight) {
            /*
             *
             * Vertical column hover effect + header cells mouseover effect
             *
             */

            $('#'+opts.tableid).delegate('th','mouseover mouseleave', function(e) {
                if (e.type == 'mouseover') {
                    $(this).addClass("hover");
                    $('#'+opts.tableid).find("colgroup").eq($(this).index()).addClass("hover");
                } else {
                    $(this).removeClass("hover");
                    $('#'+opts.tableid).find("colgroup").eq($(this).index()).removeAttr("class");
                }
            });
        }

        if(opts.click_enlarge) {
            /*
             *
             * Enlarge click area to complete cell to improve usability
             * Cells that contain a <a> tag will be completely clickable, others not
             *
             */

            $('#'+opts.tableid+' td:has(a)').on('mouseover mouseleave click', function(e) {
                if (e.type == 'mouseover') {
                    $(this).addClass("hover");
                } else if (e.type == 'mouseleave'){
                    $(this).removeClass("hover");
                } else if (e.type == 'click'){
                    window.location = $(this).find("a").attr('href');
                }
            });
        }

        if(opts.zebra) {
            /* add zebra */
            setTimeout(function() {
                var base = $("table.overview tbody");
                base.find("tr:nth-child(2n)").addClass("even");
                base.find("tr:nth-child(-1n)").addClass("odd");
            },500);
        }

        /*
         *
         * Now you can add sorting/filtering/paging e.g. by using datatables.net
         *
         */
        if($.isFunction(opts.onReady)) {
            opts.onReady();
        }

    };


return {
	BUILD: BUILD
}


})(jQuery, Mustache);