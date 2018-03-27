// Wait for device API libraries to load
//
document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("offline", isOffline, false);

// device APIs are available
//
function onDeviceReady() {
  // Register the event listener
  document.addEventListener("backbutton", onBackKeyDown, false);
}

// Handle the back button
//
function onBackKeyDown() {
  /* If the current page is the login page, disable the button completely (aka do nothing) */
  if ($.inArray($.mobile.activePage.attr('id'), ['login', 'splash', 'offline-search']) === -1) {
    swal({
      title: 'Wanna Logout?',
      html: "You are about to logout from the application",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      allowOutsideClick: false,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirm'
    }).then((result) => {
      if (result.value) {
        $.mobile.changePage("#login", "fade");
      }
    });
  }
}

// function if application is offline
function isOffline() {
  if ($.inArray($.mobile.activePage.attr('id'), ['splash']) === -1) {
    swal({
      title: 'Application is Offline',
      html: "You are about to use the application in an offline status.",
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

  console.log("lost connection");
}

var FinderAppCtrl = (function () {
  var ip_address = 'http://loz4zovy-site.atempurl.com/libraryfinderapp-api';

  var unset = function (array, list) {
    $.each(array, function (key, item) {
      if ($.inArray(key, list) !== -1) { delete array[key]; }
    });

    return array;
  };

  var initialize = {
    genre : function () {
      $.ajax({
        url: ip_address + '/v1/classifications',
        type: 'GET',
        cache: false,
        error : function(xhr, ajaxOptions, thrownError) {
          console.log(xhr.status, thrownError);
        },
        success: function(response) {
          var data = response,
            size = data.length;

          $('#genre-list').find('li.genre').remove();
          $.each(data, function (k,v) {
            var _class = (k+1) === 1 ? 'ui-first-child' : (size === (k+1) ? 'ui-last-child' : '');
            var html = ['<li data-icon="grid" class="genre '+ _class +'">',
              '<a href="#search?genre='+ v.id +'" class="ui-btn ui-btn-icon-right ui-icon-bullets">'+ ((!v.description) ? v.mime : v.description) +'</a>',
              '</li>'].join('');
            $('#genre-list').append(html);
          });
        }
      });
    },
    books : function (genre) {
      $.ajax({
        url: ip_address + '/v1/materials',
        type: 'GET',
        data : {
          genre : genre
        },
        cache: false,
        error : function(xhr, ajaxOptions, thrownError) {
          console.log(xhr.status, thrownError);
        },
        success: function(response) {
          var data = response,
            size = data.length;

          $('#available-books').html('');
          $.each(data, function (k,v) {
            var _class = (k+1) === 1 ? 'ui-first-child' : (size === (k+1) ? 'ui-last-child' : '');
            var icon = v.available_copy <= 0 ? 'ui-icon-forbidden' : 'ui-icon-check';
            var link = v.available_copy <= 0 ? '#' : '#reservation-frm?book_id='+ parseInt(v.id) ;
            var html = ['<li data-icon="info" class="'+ _class +'">',
              '<a data-book-id='+ parseInt(v.id) +' data-is-available="'+ (v.available_copy <= 0 ? 'false' : 'true') +'" href="'+ link +'" class="ui-btn ui-btn-icon-right '+ icon +' books '+ (v.available_copy <= 0 ? 'is-booked' : '') +'">'+ v.title +'</a>',
              '</li>'].join('');
            $('#available-books').append(html);
          });
        }
      })
    },
    offline : function (genre) {
      Database.get('materials_list', null, null, 'title').then((response) => {
        if (response.length === 0) {
          $('#available-materials').html('');
          swal({
            title: 'Data not synced',
            html: "Do you want to sync data to materials list?",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            allowOutsideClick: false,
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirm'
          }).then((result) => {
            if (result.value) {
             downloadData();
            }
          });
        } else {
          var data = response,
              size = data.length;

          $('#available-materials').html('');
          $.each(data, function (k,v) {
            var _class = (k+1) === 1 ? 'ui-first-child' : (size === (k+1) ? 'ui-last-child' : '');
            var icon = v.available_copy <= 0 ? 'ui-icon-forbidden' : 'ui-icon-check';
            var html = ['<li data-icon="info" class="'+ _class +'">',
              '<a data-book-id='+ parseInt(v.id) +' class="ui-btn ui-btn-icon-right '+ icon +' books '+ ((v.available_copy <= 0) ? 'is-booked' : '') +'">'+ v.title +'</a>',
              '</li>'].join('');
            $('#available-materials').append(html);
          });

        }
      }, () => {});
    }
  };

  var downloadData =  function () {
    swal({
      title: 'Syncing Materials to App',
      text: 'Please wait while loading data',
      allowOutsideClick: false,
      onOpen: () => {
        swal.showLoading()
      }
    }).then(() => {}, () => {});

    $.ajax({
      url: ip_address + '/v1/materials',
      type: 'GET',
      cache: false,
      error : function(xhr, ajaxOptions, thrownError) {
        console.log(xhr.status, thrownError);
      },
      success: function(data) {
        var size = data.length;

        if (data.length > 0) {
          swal.close();

          Database.truncate('materials_list').then((response) => {
            if (response.status) {
              $.each(data, function (index, object) {
                object = unset(object, ['deleted_at', 'deleted_by', 'updated_at', 'updated_by']);

                Database.insert('materials_list', object, ['id', 'title', 'created_at', 'created_by'], true).then(() => {}, () => {});
              });

              $('#available-materials').html('');
              $.each(data, function (k,v) {
                var _class = (k+1) === 1 ? 'ui-first-child' : (size === (k+1) ? 'ui-last-child' : '');
                var icon = v.available_copy <= 0 ? 'ui-icon-forbidden' : 'ui-icon-check';
                var html = ['<li data-icon="info" class="'+ _class +'">',
                  '<a data-book-id='+ parseInt(v.id) +' class="ui-btn ui-btn-icon-right '+ icon +' books '+ ((v.available_copy <= 0) ? 'is-booked' : '') +'">'+ v.title +'</a>',
                  '</li>'].join('');
                $('#available-materials').append(html);
              });
            }
          }, (response) => {});
        }
      }
    });
  };

  var _search = function (key) {
    $.ajax({
      url: ip_address + '/v1/materials',
      type: 'GET',
      data : {
        key : key
      },
      cache: false,
      error : function(xhr, ajaxOptions, thrownError) {
        console.log(xhr.status, thrownError);
      },
      success: function(response) {
        var data = response,
          size = data.length;

        $('#available-books').html('');
        $.each(data, function (k,v) {
          var _class = (k+1) === 1 ? 'ui-first-child' : (size === (k+1) ? 'ui-last-child' : '');
          var html = ['<li data-icon="info" class="'+ _class +'">',
            '<a href="" class="ui-btn ui-btn-icon-right ui-icon-info">'+ v.title +'</a>',
            '</li>'].join('');
          $('#available-books').append(html);
        });
      }
    });
  };

  var create = function ($data) {
    $(document).find('#reservation-form small.form-validation').html('');

    $.post(ip_address + '/v1/reservations/', $data, function (response) {
      var data = response;

      if (data.log_status === true) {
        swal({
            type: 'success',
            title : 'Success!',
            text: data.message,
            showConfirmButton: false,
            timer: 1500
          }).then(function () {}, function () {});
        
        setTimeout(function () {
          $.mobile.changePage("#search", "fade");
        }, 2000);
      } else {
        swal({
            type: 'error',
            text: data.message,
            showConfirmButton: false,
            timer: 1500
          }).then(function () {}, function () {});
      }

    }).fail(function(xhr, status, error) { 
      // error handling
      var data = JSON.parse(xhr.responseText);

      $(document).find('#reservation-form small.form-validation').html('');
      $.each(data, function (k,v) {
        $(document).find('#reservation-form small.form-validation.'+k).html(v);
      });
    });
  };

  return {
    user_data : function () {
      return JSON.parse(localStorage.getItem('user'));
    },
    Init : {
      genre : function () {
        initialize.genre();
      },
      books : function (genre) {
        initialize.books(genre);
      },
      offline : function () {
        initialize.offline();
      },
      data : function () {
        localStorage.clear();
        localStorage.removeItem('user');
      }
    },
    Reserve : function (data) {
      create(data);
    },
    Search : function (id) {
      $.ajax({
        url: ip_address + '/v1/materials/' + id,
        type: 'GET',
        cache: false,
        error : function(xhr, ajaxOptions, thrownError) {
          console.log(xhr.status, thrownError);
        },
        success: function(response) {
          var data = response[0],
              html = [
                '<b>' + data.title.toUpperCase() + '</b><br><br>',
                '<b>Author:</b> ' + ((data.author) ? data.author : 'Not Indicated') + '<br>',
                '<b>Publication Date:</b> ' + ((data.publication_date) ? data.publication_date : 'Not Indicated') + '<br>',
                '<b>Material Type:</b> ' + ((data.type) ? data.type : 'Not Indicated') + '<br>',
                '<b>Availability:</b> ' + ((data.available_copy > 0) ? 'Available ('+ data.available_copy +')' : 'Not Available')+ '<br>',
              ].join('');

          swal({
            showConfirmButton: false,
            html : '<div style="font-size: 14px; text-align: left;">' + html + '</div>'
          }).then(function () {}, function () {});
        }
      });
    },
    Login : function (data) {
      localStorage.clear();
      localStorage.removeItem('user');
      $(document).find('#login-form small.form-validation').html('');
      var login_info = data;

      $.post(ip_address + '/v1/auth/', login_info, function (response) {
        var data = response;

        if (data.status === true && data.is_active === true) {
          swal({
            type: 'success',
            title : 'Login successful.',
            showConfirmButton: false,
            timer: 1500
          }).then(function () {}, function () {});

          setTimeout( function () {
            if (!localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(data.user));
            }

            $.mobile.changePage("#home", "fade");

            $('#login-form').find('input[name="id_number"]').val(null);
            $('#login-form').find('input[name="password"]').val(null);
          }, 2000);
        } else if (data.status === true && data.is_active === false) {
          swal({
            type: 'error',
            title : 'Error!',
            text: 'Account is currently inactive.',
            showConfirmButton: false,
            timer: 1500
          }).then(function () {}, function () {});
        } else {
          swal({
            type: 'error',
            title : 'Error!',
            text: 'Invalid username or password.',
            showConfirmButton: false,
            timer: 1500
          }).then(function () {}, function () {});
        }
      }).fail(function(xhr, status, error) { 
        // error handling
        var data = JSON.parse(xhr.responseText);

        $(document).find('#login-form small.form-validation').html('');
        $.each(data, function (k,v) {
          $(document).find('#login-form small.form-validation.'+k).html(v);
        });

        if (login_info && data && ! data.status) {
          swal({
            type: 'error',
            title : 'Error!',
            text: 'Account does not exists.',
            showConfirmButton: false,
            timer: 1500
          }).then(function () {}, function () {});
        }
      });
    },
    Signup : function (data) {
      $(document).find('#signup-form small.form-validation').html('');

      $.post(ip_address + '/v1/users/', data, function (response) {
        var data = response;
        
        if (data.log_status === true) {
          $('#signup-form')[0].reset();

          swal({
            type: 'success',
            title : 'Signed up successfully.',
            showConfirmButton: false,
            timer: 1500
          });

          setTimeout( function () {
            $.mobile.changePage("#login", "fade");
          }, 2000);
        }
      }).fail(function(xhr, status, error) { 
        // error handling
        var data = JSON.parse(xhr.responseText);

        $(document).find('#signup-form small.form-validation').html('');
        $.each(data, function (k,v) {
          $(document).find('#signup-form small.form-validation.'+k).html(v);
        });
      });
    },
    Get : {
      books : function (id) {
        $.ajax({
          url: ip_address + '/v1/materials/' + id,
          type: 'GET',
          cache: false,
          error : function(xhr, ajaxOptions, thrownError) {
            console.log(xhr.status, thrownError);
          },
          success: function(response) {
            var data = response[0],
                user_data = JSON.parse(localStorage.getItem('user'));

            $('#reservation-form').find('input[name="book"]').val(data.title);
            $('#reservation-form').find('input[name="book_id"]').val(data.id);

            $.each(user_data, function (k,v) {

              switch (k) {
                case 'id': k = 'user_id'; break;
                case 'user_fullname': k = 'name'; break;
                default: k = k; break;
              }

              $('#reservation-form').find('input[name="'+ k +'"], textarea[name="'+ k +'"]').val(v);
            });
          }
        });
      },
      reservations : function (id) {
        $.ajax({
          url: ip_address + '/v1/reservations?user_id=' + id,
          type: 'GET',
          cache: false,
          error : function(xhr, ajaxOptions, thrownError) {
            console.log(xhr.status, thrownError);
          },
          success: function(response) {
            var data = response;
            
            $('#reservations-list').html('');
            $('#reservations-history-list').html('');
            $('#reservations-open-list').html('');

            $.each(data, function (k, item) {
              var reservation_status = '',
                  method = '',
                  return_date = '',
                  isOverdue = false,
                  reservation_date = '';

              switch (item.status) {
                case 'O': reservation_status = 'Open'; break;
                case 'A': reservation_status = 'Reserved / Approved'; break;
                case 'R': reservation_status = 'Rejected'; break;
                case 'C': reservation_status = 'Cancelled'; break;
                case 'RE': reservation_status = 'Returned'; break;
              }

              reservation_date = moment(new Date(item.created_at)).format('dddd, DD MMMM YYYY');
              item.created_at = moment(new Date(item.created_at)).format('DD-MM-YYYY');

              switch (item.method) {
                case '1day':
                  method = '1 Day';
                  return_date = moment(item.created_at, "DD-MM-YYYY").add(1, 'days');
                  isOverdue = moment(new Date()).isAfter(return_date);
                  return_date = moment(new Date(return_date)).format('dddd, DD MMMM YYYY');
                  break;
                case '3day':
                  method = '3 Days';
                  return_date = moment(item.created_at, "DD-MM-YYYY").add(3, 'days');
                  isOverdue = moment(new Date()).isAfter(return_date);
                  return_date = moment(new Date(return_date)).format('dddd, DD MMMM YYYY');
                  break;
                case '7days':
                  method = '7 Days';
                  return_date = moment(item.created_at, "DD-MM-YYYY").add(7, 'days');
                  isOverdue = moment(new Date()).isAfter(return_date);
                  return_date = moment(new Date(return_date)).format('dddd, DD MMMM YYYY');
                  break;
                case '5days':
                  method = '5 Days';
                  return_date = moment(item.created_at, "DD-MM-YYYY").add(5, 'days');
                  isOverdue = moment(new Date()).isAfter(return_date);
                  return_date = moment(new Date(return_date)).format('dddd, DD MMMM YYYY');
                  break;
              }

              var overdue = (isOverdue && $.inArray(item.status, ['R', 'C', 'RE']) === -1) ? '<span style="float: right;" class="overdue-badge">OVERDUE</span>' : '';
              
              if ($.inArray(item.status, ['R', 'C', 'RE']) !== -1) {
                var html = [
                  '<tr>',
                    '<td class="reservation-listing-row">',
                      '<span class="title"><b>'+ item.book_title.toUpperCase() +'</b></span><br>',
                      '<span><b>Reservation Date</b> :</span><br><span>'+ reservation_date +'</span><br>',
                      '<span><b>Reservation Method</b> : '+ method +'</span><br>',
                      '<span><b>Reservation Status</b> : '+ reservation_status +'</span><br>',
                    '</td>',
                  '</tr>'
                ].join('');

                $('#reservations-history-list').append(html);
              } else if ($.inArray(item.status, ['O']) !== -1) {
                var html = [
                  '<tr>',
                    '<td class="reservation-listing-row">',
                      '<span class="title"><b>'+ item.book_title.toUpperCase() +'</b></span><br>',
                      '<span><b>Reservation Date</b> :</span><br><span>'+ reservation_date +'</span><br>',
                      '<span><b>Reservation Method</b> : '+ method +'</span><br>',
                    '</td>',
                  '</tr>'
                ].join('');

                $('#reservations-open-list').append(html);
              } else {
                var html = [
                  '<tr>',
                    '<td class="reservation-listing-row">',
                      '<span class="title"><b>'+ item.book_title.toUpperCase() +'</b></span> ' + overdue + '<br>',
                      '<span><b>Reservation Date</b> :</span><br><span>'+ reservation_date +'</span><br>',
                      '<span><b>Reservation Method</b> : '+ method +'</span><br>',
                      '<span><b>Return Date</b> : </span><br><span>'+ return_date +'</span>',
                    '</td>',
                  '</tr>'
                ].join('');

                $('#reservations-list').append(html);
              }
            });
          }
        });
      },
      material : function (id, dom) {
        $.ajax({
          url: ip_address + '/v1/materials/' + id,
          type: 'GET',
          cache: false,
          error : function(xhr, ajaxOptions, thrownError) {
            console.log(xhr.status, thrownError);
          },
          success: function(response) {
            var data = response[0],
                html = [
                  '<b>' + data.title.toUpperCase() + '</b><br><br>',
                  '<b>Author:</b> ' + ((data.author) ? data.author : 'Not Indicated') + '<br>',
                  '<b>Publication Date:</b> ' + ((data.publication_date) ? data.publication_date : 'Not Indicated') + '<br>',
                  '<b>Material Type:</b> ' + ((data.type) ? data.type : 'Not Indicated') + '<br>',
                  '<b>Availability:</b> ' + ((data.available_copy > 0) ? 'Available ('+ data.available_copy +')' : 'Not Available')+ '<br>',
                ].join(''),
                user_data = JSON.parse(localStorage.getItem('user'));

            $(dom).html('');
            $(dom).append('<div style="font-size: 13px;">' + html + '</div>');

            $('#reservation-form').find('input[name="book"]').val(data.title);
            $('#reservation-form').find('input[name="book_id"]').val(data.id);

            $.each(user_data, function (k,v) {

              switch (k) {
                case 'id': k = 'user_id'; break;
                case 'user_fullname': k = 'name'; break;
                default: k = k; break;
              }

              $('#reservation-form').find('input[name="'+ k +'"], textarea[name="'+ k +'"]').val(v);
            });
          }
        });
      }
    },
    Sync : function () {
      downloadData();
    }
	}
})();

// Page Initialization
$(document).bind("pagebeforechange", function( event, data ) {
  $.mobile.pageData = (data && data.options && data.options.pageData) ? data.options.pageData : null;
}).on("pagebeforeshow", "#splash", function(e, data){
  localStorage.removeItem('user');
}).on("pagebeforeshow", "#login", function(e, data){
  localStorage.removeItem('user');
}).on("pagebeforeshow", "#home", function(e, data){
  if (!localStorage.getItem('user')) { $.mobile.changePage("#login", "fade"); return; }
  FinderAppCtrl.Init.genre();
}).on("pagebeforeshow", "#search", function(e, data){ 
  if (!localStorage.getItem('user')) { $.mobile.changePage("#login", "fade"); return; }
  var genre = ($.mobile.pageData && $.mobile.pageData.genre) ?  parseInt($.mobile.pageData.genre) : '';
  FinderAppCtrl.Init.books(genre);
}).on("pagebeforeshow", "#reservation-frm", function(e, data){ 
  if (!localStorage.getItem('user')) { $.mobile.changePage("#login", "fade"); return; }
  if ($.mobile.pageData && $.mobile.pageData.book_id) {
    FinderAppCtrl.Get.material($.mobile.pageData.book_id, '#rsv-material-info');
  }
}).on("pagebeforeshow", "#reservation-list", function(e, data){ 
  if (!localStorage.getItem('user')) { $.mobile.changePage("#login", "fade"); return; }
  var user_data = FinderAppCtrl.user_data();
  $('#reservation-tabs').tabs( "option", "active", 1 );
  $('#reservation-tabs a[href="#active-reservation-list"]').addClass('ui-btn-active');
  $(document).find('span.todays-date').html(moment(new Date()).format('ddd, DD MMMM YYYY'));
  FinderAppCtrl.Get.reservations(user_data['id']);
}).on("pagebeforeshow", "#offline-search", function(e, data){ 
  FinderAppCtrl.Init.offline();
});



// Page Loaded
$(document)
.delegate("#splash", "pagecreate", function(){
    setTimeout(function () {
      $.mobile.changePage("#login", "fade");
    }, 3500);
})
.delegate("#login", "pagecreate", function(){ 
    FinderAppCtrl.Init.data();
    var $_ = $(this), form = $('#login-form');

    $('#login-form').find('input[name="id_number"]').val(null);
    $('#login-form').find('input[name="password"]').val(null);
    $(document).find('#login-form small.form-validation').html('');

    $_.on('click', '#sign-in-button', function () {
      var data = form.serialize();
      FinderAppCtrl.Login(data);
    });

    $_.on('click', '#sign-up-button', function () {
      $(document).find('#login-form small.form-validation').html('');
      $(document).find('#signup-form small.form-validation').html('');
      $.mobile.changePage("#signup", "fade");
    });

    $_.on('click', '#search-materials-button', function () {
      $.mobile.changePage("#offline-search", "fade");
    });
})
.delegate("#signup", "pagecreate", function(){ 
    var $_ = $(this), form = $('#signup-form');
    $('#signup-form')[0].reset();
    $(document).find('#signup-form small.form-validation').html('');

    $_.on('click', '#save-btn', function () {
      var data = form.serialize();
      FinderAppCtrl.Signup(data);
    });
})
.delegate("#home", "pagecreate", function(){
})
.delegate("#search", "pagecreate", function(){ 
    var $_ = $(this);

    $_.on('click', '#search-page', function (event) {
        $(":mobile-pagecontainer")
          .pagecontainer("change", "#search", {  reload : false, allowSamePageTransition : true, transition : "none" });
    });

    $_.on('click', 'a.books', function () {
      var data = $(this).data();

      if (!data.isAvailable) {
        FinderAppCtrl.Search(data.bookId);
      }
    });
})
.delegate("#reservation-frm", "pagecreate", function(){ 
    var $_ = $(this), 
        form = $('#reservation-form'),
        user_data = FinderAppCtrl.user_data();

    $('#reservation-form')[0].reset();
    $(document).find('#reservation-form small.form-validation').html('');
    $.each(user_data, function (k,v) {

      switch (k) {
        case 'id': k = 'user_id'; break;
        case 'user_fullname': k = 'name'; break;
        default: k = k; break;
      }

      form.find('input[name="'+ k +'"], textarea[name="'+ k +'"]').val(v);
    });

    $_.on('click', '#reservation-page', function (event) {
        $(":mobile-pagecontainer")
          .pagecontainer("change", "#search", {  reload : false, allowSamePageTransition : true, transition : "none" });
    });

    $_.on('click', '#save-btn', function () {
      var data = form.serialize();
      FinderAppCtrl.Reserve(data);
    });

    $_.on('click', '#cancel-btn', function () {
      $('#reservation-form')[0].reset();
    });
})
.delegate("#reservation-list", "pagecreate", function(){ 
    var $_ = $(this), 
        user_data = FinderAppCtrl.user_data();

    $_.on('click', '#reservation-page', function (event) {
        $(":mobile-pagecontainer")
          .pagecontainer("change", "#reservation-list", {  reload : false, allowSamePageTransition : true, transition : "none" });
    });
})
.delegate("#offline-search", "pagecreate", function(){ 
    var $_ = $(this);

    $_.on('click', '#sign-in-button', function () {
      $(document).find('#login-form small.form-validation').html('');
      $.mobile.changePage("#login", "fade");
    });

    $_.on('click', 'a.books', function () {
      var data = $(this).data();

      Database.get('materials_list', data.bookId.toString()).then((json) => {
        var data = json,
            html = [
              '<b>' + data.title.toUpperCase() + '</b><br><br>',
              '<b>Author:</b> ' + ((data.author) ? data.author : 'Not Indicated') + '<br>',
              '<b>Publication Date:</b> ' + ((data.publication_date) ? data.publication_date : 'Not Indicated') + '<br>',
              '<b>Material Type:</b> ' + ((data.type) ? data.type : 'Not Indicated') + '<br>',
              '<b>Availability:</b> ' + ((data.available_copy > 0) ? 'Available ('+ data.available_copy +')' : 'Not Available')+ '<br>',
            ].join('');

        swal({
          showConfirmButton: false,
          html : '<div style="font-size: 14px; text-align: left;">' + html + '</div>'
        }).then(function () {}, function () {});
      }, (error) => {});
    });

    var checkInternet = function () {
      var networkState = navigator.connection.type;

      if(networkState === Connection.NONE || networkState === Connection.UNKNOWN) {
          isOffline();
          return false;
      } else {
         return true;
      }
    };

    $_.on('click', '#sync-materials-button', function () {
      if (!checkInternet()) { return; }

      if (checkInternet()) {
        swal({
          title: 'Data not synced',
          html: "Do you want to sync data to materials list?",
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          allowOutsideClick: false,
          cancelButtonColor: '#d33',
          confirmButtonText: 'Confirm'
        }).then((result) => {
          if (result.value) {
            $('#available-materials').html('');
            FinderAppCtrl.Sync();
          }
        });
      }

      FinderAppCtrl.Sync();
    });
});

// Global Footer
$('[data-role=page]').live('pageshow', function (event, ui) {
  var html = ['<center><small class="margin-y-10">Library Book-Finder Application © 2017</small></center>'].join('');
  $("#" + event.target.id).find("[data-role=footer]").html(html);
});