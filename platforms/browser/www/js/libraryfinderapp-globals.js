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
  document.addEventListener("offline", isOffline, false);
}
// Handle the back button
//
function onBackKeyDown() {
  console.log('Backbutton key pressed');
}
// function if application is offline
function isOffline() {
  swal({
    title: 'Application is Offline',
    html: "You are about to use the application in an offline status.',
    type: 'warning',
    showCancelButton: false,
    confirmButtonColor: '#3085d6',
    allowOutsideClick: false,
    cancelButtonColor: '#d33',
    confirmButtonText: 'Confirm'
  }).then((result) => {
    if (result.value) {
      swal.close();
    }
  });
}