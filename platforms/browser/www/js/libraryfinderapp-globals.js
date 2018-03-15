$(document).bind("mobileinit", function(){
  $.mobile.defaultPageTransition = "fade";
  $.mobile.allowCrossDomainPages = true;
});


// Wait for device API libraries to load
//
function onLoad() {
    document.addEventListener("deviceready", onDeviceReady, false);
}
// device APIs are available
//
function onDeviceReady() {
    // Register the event listener
    document.addEventListener("backbutton", onBackKeyDown, false);
}
// Handle the back button
//
function onBackKeyDown() {
    alert('Backbutton key pressed');
    console.log('Backbutton key pressed');
}