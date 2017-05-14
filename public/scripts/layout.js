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
  $('#main-pane').slick({infinite: false, edgeFriction: 0.15, slide: '.slide', initialSlide: 2, touchThreshold: 7})
  $('#display-body').slick({infinite: false, edgeFriction: 0.15, slide: '.slide', initialSlide: 0, touchThreshold: 7})

  // set up swiping of:
  // right swipe inner carousel if outer carousel hits right end
  // left swipe outer carousel if inner carousel hits left end
  $('#display-body').on('swipe', function(event, slick, direction) {
    var overThreshold = (slick.currentLeft > 0) // check if overflowing left
    if (direction === 'right' && overThreshold) $('#main-pane').slick('slickPrev')
  })

  $('#main-pane').on('swipe', function(event, slick, direction) {
    if (event.target !== this) return;
    var overThreshold = (slick.currentLeft < -2*$(window).width()) // check if overflowing right
    if (direction === 'left' && overThreshold) $('#display-body').slick('slickNext')
  })

  // prevent swiping of both carousels
  $('#display-body').on('touchstart touchmove mousemove mouseenter', function(event, slick, direction) {
    $('#main-pane').slick('slickSetOption', 'swipe', false, false);
  });

  $('#display-body').on('touchend mouseover mouseout', function(e) {
    $('#main-pane').slick('slickSetOption', 'swipe', true, false);
  });

  /* show suggest pane */
  $('#suggest-pane').show()
  $('#suggest-toggle').removeClass('active')
  $('#suggest-toggle').attr('data-original-title', 'Show search filters')

  /* move search box */
  $('#menu-form').append($('#searchbox-group').detach())

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
  /* hide suggest pane by default */
  $('#suggest-pane').hide()
  $('#suggest-resizer').removeClass('resizer')
  $('#suggest-resizer').addClass('resizer-inactive')
  $('#suggest-toggle').removeClass('active')
  $('#suggest-toggle').attr('data-original-title', 'Show search filters')

  /* move search box */
  $('#search-searchbox-form').append($('#searchbox-group').detach())
}

// change to desktop layout
function layout_toDesktop() {
  /* remove slick */
  $('#display-body, #main-pane').slick('unslick')
  $('.slide').removeAttr('tabindex')

  layout_desktop()
  document.isMobile = false;
}
