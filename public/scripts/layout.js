const WIDTH_THRESHOLD = 768;

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
  $('#display-body, #main-pane').slick({infinite: false, edgeFriction: 0.1, slide: '.slide'})
  $('#main-pane').slick('slickGoTo', 1, true)

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
  $('#suggest-pane').css('display', '')
  $('#suggest-toggle').removeClass('active')
  $('#menu-right').prepend($('#suggest-toggle').detach())

  /* move search box */
  $('#menu-form').append($('#searchbox').detach())
}

// change to mobile layout
function layout_toMobile() {
  layout_mobile()
  document.isMobile = true;
}

// set up desktop layout
function layout_desktop() {
  /* hide suggest pane by default and move attach toggler to left menu */
  $('#suggest-pane').css('display', 'none')
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
