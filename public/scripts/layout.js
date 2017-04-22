const WIDTH_THRESHOLD = 768;

// handles showing of initial content
function layout_initial_show() {
 // if ($('#display-initial').is(':visible') && $('#display-body').css('display') === 'none') return;

  $('#display-body').hide()
  $('#display-initial').show()

  if (document.isMobile) {
    $('#disp-title').text('Navigate by swiping left and right')
    $('#disp-title-right').text('')
    $('#disp-subtitle').text('Search to begin!')
    $('#disp-subtitle-right').text('')
  } else {
    $('#disp-title').text('Search to begin!')
    $('#disp-title-right').text('')
    $('#disp-subtitle').text('')
    $('#disp-subtitle-right').text('')
  }

  $('#searchbox').focus()

  if (document.isMobile && document.isReady) $('#main-pane').slick('slickGoTo', 2)
}

// handles hiding of initial content
function layout_initial_hide() {
  // if ($('#display-initial').css('display') === 'none' && $('#display-body').is(':visible')) return;

  $('#display-body').show()
  $('#display-initial').hide()

  if (document.isMobile) $('#display-body')[0].slick.refresh()
}

// handles refreshing of layout after resizing
function layout_refresh() {
  var width = $(window).width()
  var isMobile = (width < WIDTH_THRESHOLD)
  if (document.isMobile && !isMobile) layout_toDesktop()
  else if (!document.isMobile && isMobile) layout_toMobile()
}

// set up mobile layout
function layout_mobile() {
  /* set up slick */
  $('#main-pane').slick({infinite: false, edgeFriction: 0.1, slide: '.slide', initialSlide: 2})
  $('#display-body').slick({infinite: false, edgeFriction: 0.1, slide: '.slide', initialSlide: 0})

  $('#display-body').on('edge', function(event, slick, direction) {
    if (direction === 'right') $('#main-pane').slick('slickPrev')
  })

  $('#main-pane').on('edge', function(event, slick, direction) {
    if (direction === 'left') $('#display-body').slick('slickNext')
  })

  $('#display-body').on('touchstart touchmove mousemove mouseenter', function(e) {
    $('#main-pane').slick('slickSetOption', 'swipe', false, false);
  });

  $('#display-body').on('touchend mouseover mouseout', function(e) {
    $('#main-pane').slick('slickSetOption', 'swipe', true, false);
  });

  /* show suggest pane and attach toggler to right menu */
  $('#suggest-pane').show()
  $('#suggest-toggle').removeClass('active')
  $('#menu-right').prepend($('#suggest-toggle').detach())

  /* move search box */
  $('#menu-form').append($('#searchbox').detach())

  if (document.history_pos !== undefined && document.history_pos > 0) {
    $('#menu-brand-abbr').hide()
    $('#menu-back').show()
  } else {
    $('#menu-brand-abbr').show()
    $('#menu-back').hide()
  }
}

// change to mobile layout
function layout_toMobile() {
  layout_mobile()
  document.isMobile = true;
}

// set up desktop layout
function layout_desktop() {
  /* hide suggest pane by default and move attach toggler to left menu */
  $('#suggest-pane').hide()
  $('#suggest-toggle').removeClass('active')
  $('#menu-left').prepend($('#suggest-toggle').detach())

  /* move search box */
  $('#search-searchbox-form').append($('#searchbox').detach())
}

// change to desktop layout
function layout_toDesktop() {
  /* remove slick */
  $('#display-body, #main-pane').slick('unslick')
  $('.slide').removeAttr('tabindex')

  layout_desktop()
  document.isMobile = false;
}
