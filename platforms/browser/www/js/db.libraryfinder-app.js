var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

if (!indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}


var dbExists = false;

// Check if database exists;
var databaseExists = function (dbname, callback) {
    var req = indexedDB.open(dbname);
    var existed = true;

    req.onsuccess = function () {
        req.result.close();
        if (!existed)
            indexedDB.deleteDatabase(dbname);
        callback(existed);
    }

    req.onupgradeneeded = function () {
        existed = false;
    }
};

var validate = function (required, data) {
  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }

    return size;
  };
  var errors = new Array(),
      result = { status : true, message : [] };

  $.each(required, function (col) {
    var error = new Array();
    if (!(col in data)) {
      error[col.toString()] = (col.replace('_', ' ') + ' does not exists.');
      $.extend(true, errors, error);
    }
  });

  $.each(data, function (col, val) {
    var error = new Array();
    if (val === null || (val !== null && val === ' ' || val !== null && val === '')) {
      error[col.toString()] = (col.replace('_', ' ') + ' is required.');
      $.extend(true, errors, error);
    }
  });

  result.status = (Object.size(errors) > 0) ? false : true; 
  result.message = errors;

  return result;
};

var getColumns = function(table) {
  var database = indexedDB.open(Auth.dbname, 1),
      result = new Array();

  var unset = function (array, list) {
    $.each(array, function (key, item) {
      if ($.inArray(key, list) !== -1) { delete array[key]; }
    });

    return array;
  };

  var dataProcess = function (callback) {
    database.onsuccess = function(event) {
      var db = event.target.result,
          dbTable = db.transaction([table], "readwrite").objectStore(table);

      var indices = unset(dbTable.indexNames, ['contains', 'item', 'length']);

      callback(indices);
    };
  };

  dataProcess(function (data) {
    var columns = new Array();

    $.each(data, function (index, value) {
      columns.push(value);
    });

    $.extend(true, result, columns);
  });

  return result;
};

databaseExists(Auth.dbname, function (exists) {
  var database = indexedDB.open(Auth.dbname, 1);

  var initialize = function () {
    // Create the schema
    database.onupgradeneeded = function(event) {
      var db = event.target.result;

      var db_logs = db.createObjectStore("db_logs", {keyPath: "id", autoIncrement : true});
      var master_setup = db.createObjectStore("materials_list", {keyPath: "id", autoIncrement : true});
      
      // Create index for searchings - db_logs table
      db_logs.createIndex("is_error", "is_error", { unique : false });
      db_logs.createIndex("notification", "notification", { unique : false });
      db_logs.createIndex("date_created", "date_created", { unique : false });

      master_setup.createIndex("id", "id", { unique : true });
      master_setup.createIndex("title", "title", { unique : false });
      master_setup.createIndex("author", "author", { unique : false });
      master_setup.createIndex("created_at", "created_at", { unique : false });
      master_setup.createIndex("barcode", "barcode", { unique : true });
      master_setup.createIndex("type", "type", { unique : false });
    };
    
    database.onerror = function(event) {
      console.log("Database error: " + event.target.errorCode);
    };

    database.onsuccess = function(event) {
      var db = event.target.result;
      var transaction = db.transaction(["db_logs"], "readwrite").objectStore("db_logs");

      transaction.add({ is_error: false, notification:  'Database creation is successful.', date_created : moment(new Date).format('YYYY-MM-DD H:m:s') });
    };
  };

  if (!exists) {
    initialize();
  }
});


Database = {
  insert : function (table, data, required, bypass) {
    required = required || getColumns(table);
    bypass = bypass || false;

    var validation = (!bypass) ? validate(required, data) : { status : true, message : '' };

    var database = indexedDB.open(Auth.dbname, 1);

    return new Promise(function (resolve, reject) {
      if (validation.status) {
        database.onsuccess = function(event) {
          var db = event.target.result;
              transaction = db.transaction([table], "readwrite").objectStore(table),
              request = transaction.add(data);

          request.onsuccess = function (event) {
            var result = { success : true, id : event.target.result };
            resolve({ status: true, output : result });
          };

          request.error = function (event) {
            var result = { success : false, id : null };
            reject({ status: false, output : result });
          };
        };
      } else {
        reject({ status: false, output : validation.message });
      }
    });
  },
  get : function (table, id, limit, sort) {
    id = id || null;
    limit = limit || null;
    sort = sort || "id";

    var database = indexedDB.open(Auth.dbname, 1);

    return new Promise(function (resolve, reject) {
      database.onsuccess = function(event) {
        var db = event.target.result;
            transaction = db.transaction([table], "readwrite").objectStore(table).index(sort),
            data = new Array();

        if (id === null) {
          if (! limit) {
            var request = transaction.getAll();

            request.onsuccess = function (event) { 
              data = event.target.result;

              data = (data && data.length <= 1 && data.length !== 0) ? data[0] : data;
              resolve(data);
            };

            request.error = function (event) { reject(event.target.result); };
          } else {
            var request = transaction.getAll(null, limit);

            request.onsuccess = function (event) { 
              data = event.target.result;

              data = (data && data.length <= 1 && data.length !== 0) ? data[0] : data;
              resolve(data);
            };

            request.error = function (event) { reject(event.target.result); };
          }
        } else {
          var request = transaction.get(id);

          request.onsuccess = function (event) { 
            data = event.target.result;
            data = (data && data.length <= 1 && data.length !== 0) ? data[0] : data;
            resolve(data);
          };

          request.error = function (event) { reject(event.target.result); };
        }
      };
    });
  },
  update : function (id, table, data, required) {
    required = required || getColumns(table);

    var validation = validate(required, data);

    var database = indexedDB.open(Auth.dbname, 1);

    return new Promise(function (resolve, reject) {
      if (validation.status) {
        data.id = id;

        database.onsuccess = function(event) {
          var db = event.target.result;
              transaction = db.transaction([table], "readwrite").objectStore(table),
              request = transaction.put(data);

          request.onsuccess = function (event) {
            var result = { success : true, id : event.target.result };
            resolve({ status: true, output : result });
          };

          request.error = function (event) {
            var result = { success : false, id : null };
            reject({ status: false, output : result });
          };
        };
      } else {
        reject({ status: false, output : validation.message });
      }
    });
  },
  truncate : function (table) {
    var database = indexedDB.open(Auth.dbname, 1);

    return new Promise(function (resolve, reject) {

      database.onsuccess = function (event) {
        var db = event.target.result,
            transaction = db.transaction([table], "readwrite").objectStore(table),
            request = transaction.clear();

        request.onsuccess = function (event) {
          resolve({ status: true, output : 'Cleared successfully.' });
        };

        request.error = function (event) {
          reject({ status: false, output : 'Unable to clear table.' });
        };
      }

    });
  }
};

