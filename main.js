(function($, window) {

  'use strict';

  window.Initdocs = {

    Nav: (function() {
      var $nav;

      function init() {
        $nav = $('.js_header_nav');
        enquire.register('screen and (max-width: 570px)', {
          match: function() {
            $('.js_header_button').on('click', menuClick);
          },
          unmatch: function() {
            $('.js_header_button').off('click');
          },
          deferSetup: true
        });
      }

      function menuClick(e) {
        e.preventDefault();
        var $button = $(this);
        if ($button.hasClass('is_selected')) {
          $button.removeClass('is_selected');
          $nav.removeClass('header_has_search_expanded header_has_menu_expanded');
        } else {
          var buttonType = $button.hasClass('iconf-search') ? 'search' : 'menu';
          var classToAdd = buttonType === 'search' ? 'header_has_search_expanded' : 'header_has_menu_expanded';
          var classToRemove = buttonType === 'search' ? 'header_has_menu_expanded' : 'header_has_search_expanded';
          $nav.find('.is_selected').removeClass('is_selected');
          $button.addClass('is_selected');
          $nav.addClass(classToAdd).removeClass(classToRemove);
        }
      }
      return {
        init: init
      }
    })(),

    SearchBlock: (function() {
      function init() {
        $(document).on('focus', '.search_block', function(e) {
          $(this).addClass('search_block_has_focus');
        });
        $(document).on('blur', '.search_block', function(e) {
          $(this).removeClass('search_block_has_focus');
        });
      }
      return {
        init: init
      }
    })(),

    Equalisation: (function() {
      function init() {
        enquire.register('screen and (min-width: 480px) and (max-width: 639px)', {
          match: function() {
            atomicInit('.js_equalise_is_landing .list_item', 'equalise', function() {
              $('.js_equalise_is_landing .list_item').evenSteven({
                columns: 2,
                resize: true
              });
            });
          },
          unmatch: function() {
            $('.js_equalise_is_landing .list_item').eq(0).removeData('equalise');
            $('.js_equalise_is_landing .list_item').evenSteven('destroy');
          },
          deferSetup: true
        });
        enquire.register('screen and (min-width: 640px)', {
          match: function() {
            $('.js_equalise_is_level_2 .list_item').evenSteven({
              columns: 2,
              resize: true
            });
            atomicInit('.js_equalise_is_landing .list_item', 'equalise', function() {
              $('.js_equalise_is_landing .list_item').evenSteven({
                columns: 2,
                resize: true
              });
            });
          },
          unmatch: function() {
            $('.js_equalise_is_level_2 .list_item').evenSteven('destroy');
            $('.js_equalise_is_landing .list_item').evenSteven('destroy');
            $('.js_equalise_is_landing .list_item').eq(0).removeData('equalise');
          },
          deferSetup: true
        });
      }

      return {
        init: init
      };

    })(),

    SubNav: (function() {

      var $subNav;
      var $subNavList;
      var $headings;
      var $subNavContainer;
      var $grid;
      var currentPosition;
      var currentClass = 'subnav_link_is_current';
      var footerHeight = 0;
      var viewportHeight = 0;
      var subNavIsAtBottom = false;

      function init() {
        $grid = $('.js_grid');
        $subNav = $('#js_subnav');
        $subNavList = $subNav.find('.js_subnav_list');
        $headings = $('#js_page_content').find('h2');
        $subNavContainer = $('.js_subnav_container');
        if (!$subNav.length) {
          return;
        }
        if ($headings.length < 2) {
          $subNav.css({
            visibility: 'hidden',
            height: '1px',
            overflow: 'hidden'
          });
        } else {
          setUpLinks();
          addSubNav();
          setTimeout(initCurrentLink, 500);
          initMediaQueries();
        }
      }

      function initMediaQueries() {
        enquire.register('screen and (min-width: 960px)', {
          match: function() {
            bindEvents();
            calculateViewportHeight();
            adjustPosition();
            setWidth();
            calculateFooterHeight();
            grabHeadingPositions();
            setCurrentActiveLink();
          },
          unmatch: function() {
            resetSubNav();
            unbindEvents();
          },
          deferSetup: true
        });
      }

      function adjustPosition() {
        var subNavContainerTop = $subNavContainer.offset().top;
        var navShouldBeFixed = subNavContainerTop < window.scrollY;
        var classAction = navShouldBeFixed ? 'add' : 'remove';
        $grid[classAction + 'Class']('subnav_is_fixed');
        if (navShouldBeFixed) {
          var top = 20;
          var bottom = 20;
          var subNavHeight = $subNav.outerHeight();
          var subNavTooHigh = (subNavHeight + top) > (viewportHeight - (footerHeight + bottom));
          var scrolledToFooter = (subNavTooHigh && ((window.scrollY + viewportHeight) >= (document.body.scrollHeight - (footerHeight + bottom))));
          $grid[(scrolledToFooter ? 'add' : 'remove') + 'Class']('subnav_is_stuck_to_bottom');
        }
      }

      function initCurrentLink() {
        var $closestLink = $subNav.find('a[href="#' + getNearestHeading().attr('id') + '"]');
        var $currentLink = $subNav.find('.js_is_current');
        $currentLink.removeClass(currentClass + ' js_is_current');
        $closestLink.addClass(currentClass + ' js_is_current');
      }

      function setCurrentActiveLink() {
        var $currentLink = $subNavList.find('.js_is_current');
        if (!$currentLink.length) {
          return;
        }
        var $closestLink = $subNav.find('a[href="#' + getNearestHeading().attr('id') + '"]');
        if ($currentLink !== $closestLink) {
          $currentLink.removeClass(currentClass + ' js_is_current');
          $closestLink.addClass(currentClass + ' js_is_current');
        }
      }

      function setWidth() {
        $subNav.css('width', $subNavContainer.width() + 'px');
      }

      function resetSubNav() {
        $subNav.attr('style', '');
        $grid.removeClass('subnav_is_fixed');
      }

      function calculateViewportHeight() {
        viewportHeight = $(window).height();
      }

      function bindEvents() {
        $(window).on('scroll', $.throttle(100, function() {
          adjustPosition();
          setCurrentActiveLink();
        }));
        $(window).on('resize', $.throttle(200, function() {
          calculateViewportHeight();
          grabHeadingPositions();
        }));
      }

      window.setInterval(function() {
        grabHeadingPositions();
        setCurrentActiveLink();
      }, 2000)

      window.headingPositions = [];

      function grabHeadingPositions() {
        $headings.each(function(i) {
          var jq_obj = $(this);
          window.headingPositions[i] = jq_obj.offset().top - parseInt(jq_obj.css('marginTop'), 10);
        });
      }

      function getNearestHeading() {
        var scrollTop = $(window).scrollTop();
        var closestHeadingIndex;
        var hp = window.headingPositions;

        for (var i = 0, l = hp.length;
          ((i < l) && (typeof closestHeadingIndex === "undefined")); i++) {
          if (hp[i] > scrollTop) {
            closestHeadingIndex = Math.max(i - 1, 0);
          }
        }

        if (typeof closestHeadingIndex === "number") {
          return $headings.eq(closestHeadingIndex);
        } else {
          return $headings.eq(hp.length - 1);
        }
      }

      function unbindEvents() {
        $(window).off('scroll');
      }

      function setUpLinks() {
        $headings.each(function() {
          this.id = createId($(this).text());
        });
      }

      function createId(text) {
        return text.toLowerCase().replace(/[^a-zA-Z0-9\s\-]/gi, '').replace(/\s/g, '-');
      }

      function calculateFooterHeight() {
        footerHeight = $('.footer').outerHeight() + 20;
      }

      function addSubNav() {
        var links = '';
        var isFirst = true;
        $headings.each(function() {
          var $thisHeading = $(this);
          var headingText = $thisHeading.text();
          links += '<li class="grid_item one_whole s_one_half l_one_whole"><a href="#' + createId(headingText) + '" class="js_link subnav_link">' + headingText + '</a></li>';
          isFirst = false;
        });
        $subNavList.append(links);
      }

      return {
        init: init
      };
    })(),

    SlideItems: (function() {

      function slide(href) {
        if (href.substr(0, 1) === '#') {
          var target = $(href);
          if (target.length > 0) {
            if (!!(window.history && window.history.pushState)) {
              window.history.pushState(null, null, href);
              $('html,body').animate({
                scrollTop: 1 + (target.offset().top - parseInt(target.css('marginTop'), 10))
              }, 1000);
              return false;
            }
          }
        }
      }

      function init() {
        $(document).on('click', '.js_link', function(e) {
          slide($(this).attr('href'));
        });

        if (window.location.hash) {
          $(window).on('load', function(e) {
            slide(window.location.hash);
          });
        }
      }

      return {
        init: init
      };
    })(),

    Tabs: (function() {

      function init() {
        var tabs = $('.f-tab');
        var wrapper = $('<div class="f-tabs"><div class="tab-bar"></div><div class="tab-contents"></div></div>');
        var tabNav = $('<div class="tab-bar" />');

        // Find all <br/> elements and add empty class to parent
        $("br:first-child").each( function() {
          $(this).parent().addClass('empty-paragraph');
        });

        // Remove each empty paragraph between tabs
        $('.empty-paragraph').each(function() {
          if ( $(this).next().is('.f-tab') && $(this).prev().is('.f-tab') ) {
            $(this).remove();
          }
        })

        //Select tabs next to each other and add a wrapper around them
        $(':not(.f-tab) + .f-tab, * > .f-tab:first-of-type').each(function() {
          $(this).nextUntil(':not(.f-tab)').andSelf().wrapAll(wrapper);
        });

        // Add Tab Bar
        $('f-tabs').append(tabNav);

        if( tabs.length > 0 ) {
          var count = 0;

          tabs.each( function() {
            var parent = $(this).parent();
            var tabContent = $(this);
            var title = tabContent.find('h2').first().html();

            // Increase the counter
            count++;

            //Remove first h2(title)
            tabContent.find( 'h2' ).first().remove();

            // Get Tab Content
            var content = tabContent.html();

            // Tab Title
            var tabBar = '<div class="tab-title" data-tab="' + count + '">' + title + '</div>';

            //Tab Content
            var tabContents = '<div class="tab-content" data-tab="' + count + '">' + content + '</div>';

            //Append tab title
            parent.append(tabBar);

            //Append Tab Content
            $(this).parent().parent().find('.tab-contents').append(tabContents);

            tabContent.next( 'p[data-empty="true"]' ).remove();
          });

          // Remove unnecessary content from tabs
          tabs.remove();

          // Show the tabs
          $('.f-tabs').css('opacity', '1');

          // Set first tab and content to be active
          $('.f-tabs').each(function() {
            $(this).find('.tab-title').first().addClass('active');
            $(this).find('.tab-content').first().addClass('active');
          });

          $('.tab-bar .tab-title').click(function(){
            var tab_id = $(this).attr('data-tab');
            var parent = $(this).parent().parent();

            $(parent).find('.tab-bar .tab-title').removeClass('active');
            $(parent).find('.tab-content').removeClass('active');

            $(this).addClass('active');
            $(parent).find('.tab-content[data-tab="' + tab_id + '"]').addClass('active');
          })

          // Remove move and delete icon - we don't need this in public KB
          $('.f-tabs .fa-trash-alt, .f-tabs .fa-arrows-alt, i.line-break').remove();
        }
      }

      return {
          init: init
      };
    })(),

    Accordion: (function() {

      function init() {

        if ( $( '.f-accordion-panel' ).length > 0 ) {

          $( '.f-accordion-panel' ).each( function( i ) {

            var panel = $( '<div class="f-accordion-panel panel">' );
            var panel_heading = $( '<div class="panel-title">' );
            var panel_content = $( '<div class="panel-content">' );

            panel_heading.append( $(this).children().first().html() );
            $(this).children().first().remove();
            panel_content.append( $(this).html() );

            panel.append( panel_heading );
            panel.append( panel_content );

            $( this ).replaceWith( panel );

          } );
        }
      }

      function enable() {

        $( '.f-accordion-panel .panel-title' ).on( 'click', function() {

          var accordion = $( this ).parent();
          var parent = accordion.parent();

          if ( ! accordion.hasClass( 'active' ) ) {
            parent.children( '.f-accordion-panel' ).removeClass( 'active' );
            parent.children( '.f-accordion-panel' ).children( '.panel-content' ).slideUp(100);
            accordion.addClass( 'active' );
            accordion.children( '.panel-content' ).slideDown(100);
          } else {
            accordion.toggleClass( 'active' );
            accordion.children( '.panel-content' ).slideUp(100);
          }
        } );
      }

      $('.f-accordion-panel .fa-trash-alt, .f-accordion-panel .fa-arrows-alt, i.line-break').remove();

      return {
        init: init,
        enable: enable,
      };
    })()
  };

  function atomicInit(selector, dataValue, init) {
    if (typeof $(selector).eq(0).data(dataValue) === 'undefined') {
      $(selector).eq(0).data(dataValue, true);
      init();
    } else {
      setTimeout(function() {
        atomicInit(selector, dataValue, init);
      }, 50);
    }
  }

  var search_wrapper_needs_resizing = true;

  $(document).ready(function() {
    var search_box = $('#search');
    var search_box_value = search_box.val();
    var category_select = $('#category-select');
    var category_select_value = category_select.val();
    var search_results = $('#search_results');
    var results = $('#results');
    var no_results = $('#no-results');
    var page_content = $('#page_content');
    var search_heading = $('h1', search_results);
    var results_list = $('.search-results', search_results);
    var existing_search_get;
    var on_retry = false;

    if (search_wrapper_needs_resizing) {
      results.css({
        minHeight: $('>.wrapper', page_content).height()
      });
      search_wrapper_needs_resizing = false;
    }


    search_box.parents('form').eq(0).on('submit', function(e) {
      e.preventDefault();
      return false;
    })
    search_box.on('keyup', $.debounce(250, function() {
      execute_request();
    }));

    category_select.on('change', function() {
      execute_request();
    });

    function execute_request() {
        var value = search_box.val();
        var category_select = $('#category-select');
        var current_category_value = category_select.val();

        var safeValue = $('<div/>').text(value).html();
        if (value == search_box_value && category_select_value == current_category_value && !on_retry) {
            return;
        } else {
            on_retry = false;
            search_box_value = value;
            category_select_value = current_category_value;
            if ((typeof existing_search_get !== "undefined") && (typeof existing_search_get.abort === "function")) {
                existing_search_get.abort();
            }
        }
        if (value.length === 0) {
            search_results.hide();
            page_content.show();
        } else {
            page_content.hide();
            results_list.html('');
            search_results.show();
            search_heading.html('Procurando por &#8220;<span class="highlight">' + safeValue + '</span>&#8221;');
            search_heading.append('<img src="https://static.helpjuice.com/helpjuice_production/uploads/upload/image/1856/14890/ajax-loader.gif" class="search-activity-indicator" />')
            var search_params = {
                query: value
            };
            if(category_select_value && category_select_value != 0) {
                search_params["category_id"] = category_select_value
            }

            existing_search_get = $.get('/search',
                search_params
            ).done(function(data, status, jqXHR) {
                var result;
                var result_obj;
                var result_anchor;
                var last_published;

                search_heading.html('');
                if (data.length === 0) {
                    search_heading.html('Poxa, tivemos 0 resultados para "' + safeValue + '"');
                    append_category(search_heading)
                    results.addClass('hidden');
                    no_results.removeClass('hidden');
                    $(window).trigger('resize'); //run equalisation
                } else {
                    results.removeClass('hidden');
                    no_results.addClass('hidden');
                    search_heading.html('Resultados de busca para &#8220;<span class="highlight"> ' + safeValue + '</span>&#8221;');
                    append_category(search_heading)
                    for (var i = 0, l = data.length; i < l; i++) {
                        result = data[i].question;
                        result_obj = $("<li class=\"list_item\"><h2 class=\"list_heading text_impact\"><a></a></h2>" +
                            "<i class=\"arrow-right\"></i><p class=\"list_content\"></p><div class=\"avatars\"></div><span></span></li>  ");
                        result_anchor = $('a', result_obj);
                        result_anchor.text(result.name);
                        result_anchor.attr('href', result.url);
                        last_published = $('div', result_obj);
                        if (result.last_published_avatar != "" && result.last_published_avatar != null &&
                            result.last_published_user_name != "" && result.last_published_user_name != null &&
                            result.last_published_date != "" && result.last_published_date != null ) {
                             last_published.append(result.last_published_avatar);
                             last_published.append("Última atualização: " + result.last_published_date + ", por  " + result.last_published_user_name);
                        }

                        $('p', result_obj).text(result.answer_sample + '...');
                        results_list.append(result_obj);

                        $('ul.search-results li.list_item div.avatars').css({
                          'display': 'flex',
                          'align-items': 'center',
                          'margin-top': '10px',
                          'font-size': '14px'
                        });

                        $('ul.search-results li.list_item div.avatars img').css({
                          'margin-right': '10px',
                          'width': '36px',
                          'height': '36px',
                          'border-radius': '50%',
                          'border': '2px solid #FFF'
                        });
                    }
                }

            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 404) {
                    on_retry = true;
                    window.setTimeout(function() {
                        search_box.trigger('keyup');
                    }, 250);
                }
            });
        }
    }

    function append_category(search_heading) {
        if (category_select_value && category_select_value != 0)
            search_heading.append(' in ' + category_select.find('option:selected').text());
    }

    if (location.hash.match('#search_query') !== null) {
      search_box.val(decodeURIComponent(location.hash.split('=')[1]));
      search_box.trigger('keyup');
    }

  });

})(jQuery, window);

Initdocs.SearchBlock.init();
Initdocs.SubNav.init();
Initdocs.Equalisation.init();
Initdocs.Nav.init();
Initdocs.SlideItems.init();
Initdocs.Accordion.init();
Initdocs.Tabs.init();

// Sticky Plugin v1.0.2 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 2/14/2011
// Date: 16/04/2015
// Website: http://labs.anthonygarand.com/sticky
// Description: Makes an element on the page stick on the screen as you scroll
//       It will only set the 'top' and 'position' of your element, you
//       might need to adjust the width in some cases.

(function($) {
    var slice = Array.prototype.slice; // save ref to original slice()
    var splice = Array.prototype.splice; // save ref to original slice()

  var defaults = {
      topSpacing: 0,
      bottomSpacing: 0,
      className: 'is-sticky',
      wrapperClassName: 'sticky-wrapper',
      center: false,
      getWidthFrom: '',
      widthFromWrapper: true, // works only when .getWidthFrom is empty
      responsiveWidth: false
    },
    $window = $(window),
    $document = $(document),
    sticked = [],
    windowHeight = $window.height(),
    scroller = function() {
      var scrollTop = $window.scrollTop(),
        documentHeight = $document.height(),
        dwh = documentHeight - windowHeight,
        extra = (scrollTop > dwh) ? dwh - scrollTop : 0;

      for (var i = 0; i < sticked.length; i++) {
        var s = sticked[i],
          elementTop = s.stickyWrapper.offset().top,
          etse = elementTop - s.topSpacing - extra;

        if (scrollTop <= etse) {
          if (s.currentTop !== null) {
            s.stickyElement
              .css({
                'width': '',
                'position': '',
                'top': ''
              });
            s.stickyElement.parent().removeClass(s.className);
            s.stickyElement.trigger('sticky-end', [s]);
            s.currentTop = null;
          }
        }
        else {
          var newTop = documentHeight - s.stickyElement.outerHeight()
            - s.topSpacing - s.bottomSpacing - scrollTop - extra;
          if (newTop < 0) {
            newTop = newTop + s.topSpacing;
          } else {
            newTop = s.topSpacing;
          }
          if (s.currentTop != newTop) {
            var newWidth;
            if ( s.getWidthFrom ) {
                newWidth = $(s.getWidthFrom).width() || null;
            }
            else if(s.widthFromWrapper) {
                newWidth = s.stickyWrapper.width();
            }
            if ( newWidth == null ) {
                newWidth = s.stickyElement.width();
            }
            s.stickyElement
              .css('width', newWidth)
              .css('position', 'fixed')
              .css('top', newTop);

            s.stickyElement.parent().addClass(s.className);

            if (s.currentTop === null) {
              s.stickyElement.trigger('sticky-start', [s]);
            } else {
              // sticky is started but it have to be repositioned
              s.stickyElement.trigger('sticky-update', [s]);
            }

            if (s.currentTop === s.topSpacing && s.currentTop > newTop || s.currentTop === null && newTop < s.topSpacing) {
              // just reached bottom || just started to stick but bottom is already reached
              s.stickyElement.trigger('sticky-bottom-reached', [s]);
            } else if(s.currentTop !== null && newTop === s.topSpacing && s.currentTop < newTop) {
              // sticky is started && sticked at topSpacing && overflowing from top just finished
              s.stickyElement.trigger('sticky-bottom-unreached', [s]);
            }

            s.currentTop = newTop;
          }
        }
      }
    },
    resizer = function() {
      windowHeight = $window.height();

      for (var i = 0; i < sticked.length; i++) {
        var s = sticked[i];
        var newWidth = null;
        if ( s.getWidthFrom ) {
            if ( s.responsiveWidth === true ) {
                newWidth = $(s.getWidthFrom).width();
            }
        }
        else if(s.widthFromWrapper) {
            newWidth = s.stickyWrapper.width();
        }
        if ( newWidth != null ) {
            s.stickyElement.css('width', newWidth);
        }
      }
    },
    methods = {
      init: function(options) {
        var o = $.extend({}, defaults, options);
        return this.each(function() {
          var stickyElement = $(this);

          var stickyId = stickyElement.attr('id');
          var stickyHeight = stickyElement.outerHeight();
          var wrapperId = stickyId ? stickyId + '-' + defaults.wrapperClassName : defaults.wrapperClassName
          var wrapper = $('<div></div>')
            .attr('id', wrapperId)
            .addClass(o.wrapperClassName);

          stickyElement.wrapAll(wrapper);

          var stickyWrapper = stickyElement.parent();

          if (o.center) {
            stickyWrapper.css({width:stickyElement.outerWidth(),marginLeft:"auto",marginRight:"auto"});
          }

          if (stickyElement.css("float") == "right") {
            stickyElement.css({"float":"none"}).parent().css({"float":"right"});
          }

          stickyWrapper.css('height', stickyHeight);

          o.stickyElement = stickyElement;
          o.stickyWrapper = stickyWrapper;
          o.currentTop    = null;

          sticked.push(o);
        });
      },
      update: scroller,
      unstick: function(options) {
        return this.each(function() {
          var that = this;
          var unstickyElement = $(that);

          var removeIdx = -1;
          var i = sticked.length;
          while ( i-- > 0 )
          {
            if (sticked[i].stickyElement.get(0) === that)
            {
                splice.call(sticked,i,1);
                removeIdx = i;
            }
          }
          if(removeIdx != -1)
          {
            unstickyElement.unwrap();
            unstickyElement
              .css({
                'width': '',
                'position': '',
                'top': '',
                'float': ''
              })
            ;
          }
        });
      }
    };

  // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
  if (window.addEventListener) {
    window.addEventListener('scroll', scroller, false);
    window.addEventListener('resize', resizer, false);
  } else if (window.attachEvent) {
    window.attachEvent('onscroll', scroller);
    window.attachEvent('onresize', resizer);
  }

  $.fn.sticky = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }
  };

  $.fn.unstick = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.unstick.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }

  };
  $(function() {
    setTimeout(scroller, 0);
  });
})(jQuery);

// Disable autofocus on search
$(function() {
  $('input').blur();
});

//You can force a search by appending #search_query=#{QUERY GOES HERE}
if (window.location.hash) {
  hash = (window.location.hash).split("#")[1];
  if (hash.split('=')[0] == 'search_query'){
    query = hash.split('=')[1];
    query = decodeURIComponent(query);
    $('#search').val(query);
  }
}

// Expand textarea in contact form
$('#expand textarea').each(function () {
  this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
}).on('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

$(window).load( function() {
    Initdocs.Accordion.enable();
} );

// Request an article modal - knowledge experts
var $modal = $( '#request_article_modal' );
if ( $modal.length > 0 ) {
    // We have a modal, let's listen to click on trigger elements
    $( '.open-request-article-modal' ).click( function() {
        $modal.fadeIn( 300 ).addClass( 'open' );
        $modal.click( function(ev) {
            if( $( ev.target ).parents( '.modal' ).length == 0 ) {
              $modal.fadeOut(300, function() {
                $( this ).removeClass( 'open' );
              } );
            }
        } );
    } );
}

//Remove delete icon for alert blocks on public KB
$('.hj-alert-block .fa-trash-alt').remove();

$(document).ready(function() {

  // Load the first 6 author articles
  $('#author-articles .author-article:lt(6)').css('display', 'flex');

  var authorArticles =  $('#author-articles .author-article').length;
  var showAuthorArticles =  6;

  if (authorArticles >= 7) {
      $('div.load-more-author-articles').css('display', 'flex');
  }

  $('div.load-more-author-articles').click(function () {
      showAuthorArticles = $('#author-articles .author-article:visible').size()+6;
      if(showAuthorArticles < authorArticles) {
        $('#author-articles .author-article:lt('+showAuthorArticles+')').css('display', 'flex');
      } else {
        $('#author-articles .author-article:lt('+authorArticles+')').css('display', 'flex');
        $('div.load-more-author-articles').hide();
      }
  });

  // Load the first 5 author followed articles
  $('.author-followed-articles .author-followed-article:lt(5)').removeClass('hidden');

  //Check how many author followed articles we have
  var authorFollowedArticlesCount = $('.author-followed-articles .author-followed-article').length
  // If there is 6 or more show view all link
  if (authorFollowedArticlesCount >= 6) {
      $('.view-author-followed-articles').css('display', 'block');
  }
  //On click show all the articles and hide view all link
  $('.view-author-followed-articles').click(function() {
    $(this).parent().find('ul li.author-followed-article').removeClass('hidden');
    $(this).hide();
  });

  $('.currentCategory').click(function() {
    $(this).parent().find('.author-categories').toggleClass('active');
  });

  // Filter Author Articles by categories
  $("ul.filterAuthorArticles li").click(function(){
     var filters = $(this).data("filter");
     var currentCategory = $(this).text()

     $("div#author-articles").find(".author-article").hide();
     $("div#author-articles").find(".author-article." + filters).css('display', 'flex');
     $('div.currentCategory span').text(currentCategory)
     $('div.load-more-author-articles').css('display', 'none');
     $(this).parent().parent().removeClass('active');
  });
});

/*======= Set the default icon to the Q&A icon instead of the folder icon =======*/
const folderIcon = document.querySelectorAll(".landing_page .common-questions .rounded.kb span .far.fa-folder");

if(folderIcon) {
    folderIcon.forEach(folder => {
        folder.parentElement.innerHTML = `<span class="category_icon icon-{{ category.name | downcase | remove:'?' | remove:',' | remove:'.' | remove:':' | remove:';' | replace:' ','-' | replace:"'",'' | replace:'&','and' }}"></span>`;
    });
}
