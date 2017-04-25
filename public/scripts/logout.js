// to intialize logout button
var init_logout = function() {
  $('#menu-bar').mouseleave(function() {
    var isNetidInvisible = !$('#netid').is(':visible')
    if (isNetidInvisible) {
      if (document.isMobile) $('#netid, #logout').slideToggle()
      else $('#netid, #logout').animate({width: 'toggle'})
    }
  })

  $('#netid').click(function() {
    var isLogoutVisible = $('#logout').is(':visible')
    if (!isLogoutVisible) {
      if (document.isMobile) $('#netid, #logout').slideToggle()
      else $('#netid, #logout').animate({width: 'toggle'})
    }
    return false;
  })
}
