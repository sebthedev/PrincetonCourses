
// handles refreshing of layout after resizing
function layout_refresh() {
  var width = $(window).width()
  if (width > 767) layout_toDesktop()
  else layout_toMobile()
}

function layout_toMobile() {
  /* set up slick */
  if (document.isMobile !== true) {
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
  }

  $('#suggest-pane').css('display', '')
  $('#suggest-toggle').removeClass('active')

  var searchbox = $('#searchbox').detach()
  $('#menu-form').append(searchbox)
  document.isMobile = true;
}

function layout_toDesktop() {
  if (document.isMobile === true) {
    $('#display-body, #main-pane').slick('unslick')
    $('.slide').removeAttr('tabindex')
  }
  if (document.isMobile !== false) {
    $('#suggest-pane').css('display', 'none')
    $('#suggest-toggle').removeClass('active')
  }
  var searchbox = $('#searchbox').detach()
  $('#search-searchbox-form').append(searchbox)
  document.isMobile = false;
}
