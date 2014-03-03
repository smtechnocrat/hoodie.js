// Remote
// ========

// Connection to a remote Couch Database.
//
// store API
// ----------------
//
// object loading / updating / deleting
//
// * find(type, id)
// * findAll(type )
// * add(type, object)
// * save(type, id, object)
// * update(type, id, new_properties )
// * updateAll( type, new_properties)
// * remove(type, id)
// * removeAll(type)
//
// custom requests
//
// * request(view, params)
// * get(view, params)
// * post(view, params)
//
// synchronization
//
// * connect()
// * disconnect()
// * pull()
// * push()
// * sync()
//
// event binding
//
// * on(event, callback)
//

var hoodieStoreApi = require('./api');
var extend = require('extend');
var generateId = require('../../utils/generate_id');
var resolveWith = require('../../utils/promise/resolve_with');

//
/**
 * Description
 * @method hoodieRemoteStore
 * @param {} hoodie
 * @param {} options
 * @return remote
 */
/**
 * Description
 * @method hoodieRemoteStore
 * @param {} hoodie
 * @param {} options
 * @return remote
 */
function hoodieRemoteStore(hoodie, options) {

  var remoteStore = {};


  // Remote Store Persistance methods
  // ----------------------------------

  /**
   * Description find one object
   * @method find
   * @param {} type
   * @param {} id
   * @return CallExpression
   */
  /**
   * Description
   * @method find
   * @param {} type
   * @param {} id
   * @return CallExpression
   */
  remoteStore.find = function find(type, id) {
    var path;

    path = type + '/' + id;

    if (remote.prefix) {
      path = remote.prefix + path;
    }

    path = '/' + encodeURIComponent(path);

    return remote.request('GET', path).then(parseFromRemote);
  };


  /**
   * Description find all objects, can be filetered by a type
   * @method findAll
   * @param {} type
   * @return CallExpression
   */
  /**
   * Description
   * @method findAll
   * @param {} type
   * @return CallExpression
   */
  remoteStore.findAll = function findAll(type) {
    var endkey, path, startkey;

    path = '/_all_docs?include_docs=true';

    switch (true) {
    case (type !== undefined) && remote.prefix !== '':
      startkey = remote.prefix + type + '/';
      break;
    case type !== undefined:
      startkey = type + '/';
      break;
    case remote.prefix !== '':
      startkey = remote.prefix;
      break;
    default:
      startkey = '';
    }

    if (startkey) {

      // make sure that only objects starting with
      // `startkey` will be returned
      endkey = startkey.replace(/.$/, function(chars) {
        var charCode;
        charCode = chars.charCodeAt(0);
        return String.fromCharCode(charCode + 1);
      });
      path = '' + path + '&startkey="' + (encodeURIComponent(startkey)) + '"&endkey="' + (encodeURIComponent(endkey)) + '"';
    }

    return remote.request('GET', path).then(mapDocsFromFindAll).then(parseAllFromRemote);
  };


  // save
  // ------

  // save a new object. If it existed before, all properties
  // will be overwritten
  //
  /**
   * Description
   * @method save
   * @param {} object
   * @return CallExpression
   */
  /**
   * Description
   * @method save
   * @param {} object
   * @return CallExpression
   */
  remoteStore.save = function save(object) {
    var path;

    if (!object.id) {
      object.id = generateId();
    }

    object = parseForRemote(object);
    path = '/' + encodeURIComponent(object._id);
    return remote.request('PUT', path, {
      data: object
    });
  };


  // remove
  // ---------

  // remove one object
  //
  /**
   * Description
   * @method remove
   * @param {} type
   * @param {} id
   * @return CallExpression
   */
  /**
   * Description
   * @method remove
   * @param {} type
   * @param {} id
   * @return CallExpression
   */
  remoteStore.remove = function remove(type, id) {
    return remote.update(type, id, {
      _deleted: true
    });
  };


  // removeAll
  // ------------

  // remove all objects, can be filtered by type
  //
  /**
   * Description
   * @method removeAll
   * @param {} type
   * @return CallExpression
   */
  /**
   * Description
   * @method removeAll
   * @param {} type
   * @return CallExpression
   */
  remoteStore.removeAll = function removeAll(type) {
    return remote.updateAll(type, {
      _deleted: true
    });
  };


  var remote = hoodieStoreApi(hoodie, {

    name: options.name,

    backend: {
      save: remoteStore.save,
      find: remoteStore.find,
      findAll: remoteStore.findAll,
      remove: remoteStore.remove,
      removeAll: remoteStore.removeAll
    }
  });





  // properties
  // ------------

  // name

  // the name of the Remote is the name of the
  // CouchDB database and is also used to prefix
  // triggered events
  //
  var remoteName = null;


  // sync

  // if set to true, updates will be continuously pulled
  // and pushed. Alternatively, `sync` can be set to
  // `pull: true` or `push: true`.
  //
  remote.connected = false;


  // prefix

  // prefix for docs in a CouchDB database, e.g. all docs
  // in public user stores are prefixed by '$public/'
  //
  remote.prefix = '';
  var remotePrefixPattern = new RegExp('^');


  // defaults
  // ----------------

  //
  if (options.name !== undefined) {
    remoteName = options.name;
  }

  if (options.prefix !== undefined) {
    remote.prefix = options.prefix;
    remotePrefixPattern = new RegExp('^' + remote.prefix);
  }

  if (options.baseUrl !== null) {
    remote.baseUrl = options.baseUrl;
  }


  // request
  // ---------

  // wrapper for hoodie's request, with some store specific defaults
  // and a prefixed path
  //
  /**
   * Description
   * @method request
   * @param {} type
   * @param {} path
   * @param {} options
   * @return CallExpression
   */
  /**
   * Description
   * @method request
   * @param {} type
   * @param {} path
   * @param {} options
   * @return CallExpression
   */
  remote.request = function remoteRequest(type, path, options) {
    options = options || {};

    if (remoteName) {
      path = '/' + (encodeURIComponent(remoteName)) + path;
    }

    if (remote.baseUrl) {
      path = '' + remote.baseUrl + path;
    }

    options.contentType = options.contentType || 'application/json';

    if (type === 'POST' || type === 'PUT') {
      options.dataType = options.dataType || 'json';
      options.processData = options.processData || false;
      options.data = JSON.stringify(options.data);
    }
    return hoodie.request(type, path, options);
  };


  // isKnownObject
  // ---------------

  // determine between a known and a new object
  //
  /**
   * Description
   * @method isKnownObject
   * @param {} object
   * @return
   */
  /**
   * Description
   * @method isKnownObject
   * @param {} object
   * @return
   */
  remote.isKnownObject = function isKnownObject(object) {
    var key = '' + object.type + '/' + object.id;

    if (knownObjects[key] !== undefined) {
      return knownObjects[key];
    }
  };


  // markAsKnownObject
  // -------------------

  // determine between a known and a new object
  //
  /**
   * Description
   * @method markAsKnownObject
   * @param {} object
   * @return MemberExpression
   */
  /**
   * Description
   * @method markAsKnownObject
   * @param {} object
   * @return MemberExpression
   */
  remote.markAsKnownObject = function markAsKnownObject(object) {
    var key = '' + object.type + '/' + object.id;
    knownObjects[key] = 1;
    return knownObjects[key];
  };


  // synchronization
  // -----------------

  // Connect
  // ---------

  // start syncing. `remote.bootstrap()` will automatically start
  // pulling when `remote.connected` remains true.
  //
  /**
   * Description
   * @method connect
   * @param {} name
   * @return CallExpression
   */
  /**
   * Description
   * @method connect
   * @param {} name
   * @return CallExpression
   */
  remote.connect = function connect(name) {
    if (name) {
      remoteName = name;
    }
    remote.connected = true;
    remote.trigger('connect');
    return remote.bootstrap().then(function() {
      remote.push();
    });
  };


  // Disconnect
  // ------------

  // stop syncing changes from remote store
  //
  /**
   * Description
   * @method disconnect
   * @return
   */
  /**
   * Description
   * @method disconnect
   * @return
   */
  remote.disconnect = function disconnect() {
    remote.connected = false;
    remote.trigger('disconnect'); // TODO: spec that
    if (pullRequest) {
      pullRequest.abort();
    }

    if (pushRequest) {
      pushRequest.abort();
    }

  };


  // isConnected
  // -------------

  //
  /**
   * Description
   * @method isConnected
   * @return MemberExpression
   */
  /**
   * Description
   * @method isConnected
   * @return MemberExpression
   */
  remote.isConnected = function isConnected() {
    return remote.connected;
  };


  // getSinceNr
  // ------------

  // returns the sequence number from wich to start to find changes in pull
  //
  var since = options.since || 0; // TODO: spec that!
  /**
   * Description
   * @method getSinceNr
   * @return since
   */
  /**
   * Description
   * @method getSinceNr
   * @return since
   */
  remote.getSinceNr = function getSinceNr() {
    if (typeof since === 'function') {
      return since();
    }

    return since;
  };


  // bootstrap
  // -----------

  // inital pull of data of the remote store. By default, we pull all
  // changes since the beginning, but this behavior might be adjusted,
  // e.g for a filtered bootstrap.
  //
  var isBootstrapping = false;
  /**
   * Description
   * @method bootstrap
   * @return CallExpression
   */
  /**
   * Description
   * @method bootstrap
   * @return CallExpression
   */
  remote.bootstrap = function bootstrap() {
    isBootstrapping = true;
    remote.trigger('bootstrap:start');
    return remote.pull().done(handleBootstrapSuccess).fail(handleBootstrapError);
  };


  // pull changes
  // --------------

  // a.k.a. make a GET request to CouchDB's `_changes` feed.
  // We currently make long poll requests, that we manually abort
  // and restart each 25 seconds.
  //
  var pullRequest, pullRequestTimeout;
  /**
   * Description
   * @method pull
   * @return CallExpression
   */
  /**
   * Description
   * @method pull
   * @return CallExpression
   */
  remote.pull = function pull() {
    pullRequest = remote.request('GET', pullUrl());

    if (remote.isConnected()) {
      global.clearTimeout(pullRequestTimeout);
      pullRequestTimeout = global.setTimeout(restartPullRequest, 25000);
    }

    return pullRequest.done(handlePullSuccess).fail(handlePullError);
  };


  // push changes
  // --------------

  // Push objects to remote store using the `_bulk_docs` API.
  //
  var pushRequest;
  /**
   * Description
   * @method push
   * @param {} objects
   * @return pushRequest
   */
  /**
   * Description
   * @method push
   * @param {} objects
   * @return pushRequest
   */
  remote.push = function push(objects) {
    var object, objectsForRemote, _i, _len;

    if (!$.isArray(objects)) {
      objects = defaultObjectsToPush();
    }

    if (objects.length === 0) {
      return resolveWith([]);
    }

    objectsForRemote = [];

    for (_i = 0, _len = objects.length; _i < _len; _i++) {

      // don't mess with original objects
      object = extend(true, {}, objects[_i]);
      addRevisionTo(object);
      object = parseForRemote(object);
      objectsForRemote.push(object);
    }
    pushRequest = remote.request('POST', '/_bulk_docs', {
      data: {
        docs: objectsForRemote,
        new_edits: false
      }
    });

    pushRequest.done(function() {
      for (var i = 0; i < objects.length; i++) {
        remote.trigger('push', objects[i]);
      }
    });
    return pushRequest;
  };

  // sync changes
  // --------------

  // push objects, then pull updates.
  //
  /**
   * Description
   * @method sync
   * @param {} objects
   * @return CallExpression
   */
  /**
   * Description
   * @method sync
   * @param {} objects
   * @return CallExpression
   */
  remote.sync = function sync(objects) {
    return remote.push(objects).then(remote.pull);
  };

  //
  // Private
  // ---------
  //

  // in order to differentiate whether an object from remote should trigger a 'new'
  // or an 'update' event, we store a hash of known objects
  var knownObjects = {};


  // valid CouchDB doc attributes starting with an underscore
  //
  var validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];


  // default objects to push
  // --------------------------

  // when pushed without passing any objects, the objects returned from
  // this method will be passed. It can be overwritten by passing an
  // array of objects or a function as `options.objects`
  //
  /**
   * Description
   * @method defaultObjectsToPush
   * @return ArrayExpression
   */
  /**
   * Description
   * @method defaultObjectsToPush
   * @return ArrayExpression
   */
  var defaultObjectsToPush = function defaultObjectsToPush() {
      return [];
    };
  if (options.defaultObjectsToPush) {
    if ($.isArray(options.defaultObjectsToPush)) {
      /**
       * Description
       * @return MemberExpression
       */
      /**
       * Description
       * @return MemberExpression
       */
      defaultObjectsToPush = function defaultObjectsToPush() {
        return options.defaultObjectsToPush;
      };
    } else {
      defaultObjectsToPush = options.defaultObjectsToPush;
    }
  }


  // setSinceNr
  // ------------

  // sets the sequence number from wich to start to find changes in pull.
  // If remote store was initialized with since : function(nr) { ... },
  // call the function with the seq passed. Otherwise simply set the seq
  // number and return it.
  //
  /**
   * Description
   * @method setSinceNr
   * @param {} seq
   * @return since
   */
  /**
   * Description
   * @method setSinceNr
   * @param {} seq
   * @return since
   */
  function setSinceNr(seq) {
    if (typeof since === 'function') {
      return since(seq);
    }

    since = seq;
    return since;
  }


  // Parse for remote
  // ------------------

  // parse object for remote storage. All properties starting with an
  // `underscore` do not get synchronized despite the special properties
  // `_id`, `_rev` and `_deleted` (see above)
  //
  // Also `id` gets replaced with `_id` which consists of type & id
  //
  /**
   * Description
   * @method parseForRemote
   * @param {} object
   * @return properties
   */
  /**
   * Description
   * @method parseForRemote
   * @param {} object
   * @return properties
   */
  function parseForRemote(object) {
    var attr, properties;
    properties = extend({}, object);

    for (attr in properties) {
      if (properties.hasOwnProperty(attr)) {
        if (validSpecialAttributes.indexOf(attr) !== -1) {
          continue;
        }
        if (!/^_/.test(attr)) {
          continue;
        }
        delete properties[attr];
      }
    }

    // prepare CouchDB id
    properties._id = '' + properties.type + '/' + properties.id;
    if (remote.prefix) {
      properties._id = '' + remote.prefix + properties._id;
    }
    delete properties.id;
    return properties;
  }


  // ### _parseFromRemote

  // normalize objects coming from remote
  //
  // renames `_id` attribute to `id` and removes the type from the id,
  // e.g. `type/123` -> `123`
  //
  /**
   * Description
   * @method parseFromRemote
   * @param {} object
   * @return object
   */
  /**
   * Description
   * @method parseFromRemote
   * @param {} object
   * @return object
   */
  function parseFromRemote(object) {
    var id, ignore, _ref;

    // handle id and type
    id = object._id || object.id;
    delete object._id;

    if (remote.prefix) {
      id = id.replace(remotePrefixPattern, '');
      // id = id.replace(new RegExp('^' + remote.prefix), '');
    }

    // turn doc/123 into type = doc & id = 123
    // NOTE: we don't use a simple id.split(/\//) here,
    // as in some cases IDs might contain '/', too
    //
    _ref = id.match(/([^\/]+)\/(.*)/), ignore = _ref[0], object.type = _ref[1], object.id = _ref[2];

    return object;
  }

  /**
   * Description
   * @method parseAllFromRemote
   * @param {} objects
   * @return _results
   */
  /**
   * Description
   * @method parseAllFromRemote
   * @param {} objects
   * @return _results
   */
  function parseAllFromRemote(objects) {
    var object, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      _results.push(parseFromRemote(object));
    }
    return _results;
  }


  // ### _addRevisionTo

  // extends passed object with a _rev property
  //
  /**
   * Description
   * @method addRevisionTo
   * @param {} attributes
   * @return
   */
  /**
   * Description
   * @method addRevisionTo
   * @param {} attributes
   * @return
   */
  function addRevisionTo(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/), currentRevNr = _ref[0], currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = generateNewRevisionId();

    // local changes are not meant to be replicated outside of the
    // users database, therefore the `-local` suffix.
    if (attributes._$local) {
      newRevisionId += '-local';
    }

    attributes._rev = '' + (currentRevNr + 1) + '-' + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };

    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  }


  // ### generate new revision id

  //
  /**
   * Description
   * @method generateNewRevisionId
   * @return CallExpression
   */
  /**
   * Description
   * @method generateNewRevisionId
   * @return CallExpression
   */
  function generateNewRevisionId() {
    return generateId(9);
  }


  // ### map docs from findAll

  //
  /**
   * Description
   * @method mapDocsFromFindAll
   * @param {} response
   * @return CallExpression
   */
  /**
   * Description
   * @method mapDocsFromFindAll
   * @param {} response
   * @return CallExpression
   */
  function mapDocsFromFindAll(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  }


  // ### pull url

  // Depending on whether remote is connected (= pulling changes continuously)
  // return a longpoll URL or not. If it is a beginning bootstrap request, do
  // not return a longpoll URL, as we want it to finish right away, even if there
  // are no changes on remote.
  //
  /**
   * Description
   * @method pullUrl
   * @return
   */
  /**
   * Description
   * @method pullUrl
   * @return
   */
  function pullUrl() {
    var since;
    since = remote.getSinceNr();
    if (remote.isConnected() && !isBootstrapping) {
      return '/_changes?include_docs=true&since=' + since + '&heartbeat=10000&feed=longpoll';
    } else {
      return '/_changes?include_docs=true&since=' + since;
    }
  }


  // ### restart pull request

  // request gets restarted automaticcally
  // when aborted (see handlePullError)
  /**
   * Description
   * @method restartPullRequest
   * @return
   */
  /**
   * Description
   * @method restartPullRequest
   * @return
   */
  function restartPullRequest() {
    if (pullRequest) {
      pullRequest.abort();
    }
  }


  // ### pull success handler

  // request gets restarted automaticcally
  // when aborted (see handlePullError)
  //
  /**
   * Description
   * @method handlePullSuccess
   * @param {} response
   * @return
   */
  /**
   * Description
   * @method handlePullSuccess
   * @param {} response
   * @return
   */
  function handlePullSuccess(response) {
    setSinceNr(response.last_seq);
    handlePullResults(response.results);
    if (remote.isConnected()) {
      return remote.pull();
    }
  }


  // ### pull error handler

  // when there is a change, trigger event,
  // then check for another change
  //
  /**
   * Description
   * @method handlePullError
   * @param {} xhr
   * @param {} error
   * @return
   */
  /**
   * Description
   * @method handlePullError
   * @param {} xhr
   * @param {} error
   * @return
   */
  function handlePullError(xhr, error) {
    if (!remote.isConnected()) {
      return;
    }

    switch (xhr.status) {
      // Session is invalid. User is still login, but needs to reauthenticate
      // before sync can be continued
    case 401:
      remote.trigger('error:unauthenticated', error);
      return remote.disconnect();

      // the 404 comes, when the requested DB has been removed
      // or does not exist yet.
      //
      // BUT: it might also happen that the background workers did
      //      not create a pending database yet. Therefore,
      //      we try it again in 3 seconds
      //
      // TODO: review / rethink that.
      //
    case 404:
      return global.setTimeout(remote.pull, 3000);

    case 500:
      //
      // Please server, don't give us these. At least not persistently
      //
      remote.trigger('error:server', error);
      global.setTimeout(remote.pull, 3000);
      return hoodie.checkConnection();
    default:
      // usually a 0, which stands for timeout or server not reachable.
      if (xhr.statusText === 'abort') {
        // manual abort after 25sec. restart pulling changes directly when connected
        return remote.pull();
      } else {

        // oops. This might be caused by an unreachable server.
        // Or the server cancelled it for what ever reason, e.g.
        // heroku kills the request after ~30s.
        // we'll try again after a 3s timeout
        //
        global.setTimeout(remote.pull, 3000);
        return hoodie.checkConnection();
      }
    }
  }


  // ### handle initial bootstrapping from remote
  //
  /**
   * Description
   * @method handleBootstrapSuccess
   * @return
   */
  /**
   * Description
   * @method handleBootstrapSuccess
   * @return
   */
  function handleBootstrapSuccess() {
    isBootstrapping = false;
    remote.trigger('bootstrap:end');
  }

  // ### handle error of initial bootstrapping from remote
  //
  /**
   * Description
   * @method handleBootstrapError
   * @param {} error
   * @return
   */
  /**
   * Description
   * @method handleBootstrapError
   * @param {} error
   * @return
   */
  function handleBootstrapError(error) {
    isBootstrapping = false;
    remote.trigger('bootstrap:error', error);
  }

  // ### handle changes from remote
  //
  /**
   * Description
   * @method handlePullResults
   * @param {} changes
   * @return
   */
  /**
   * Description
   * @method handlePullResults
   * @param {} changes
   * @return
   */
  function handlePullResults(changes) {
    var doc, event, object, _i, _len;

    for (_i = 0, _len = changes.length; _i < _len; _i++) {
      doc = changes[_i].doc;

      if (remote.prefix && doc._id.indexOf(remote.prefix) !== 0) {
        continue;
      }

      object = parseFromRemote(doc);

      if (object._deleted) {
        if (!remote.isKnownObject(object)) {
          continue;
        }
        event = 'remove';
        remote.isKnownObject(object);
      } else {
        if (remote.isKnownObject(object)) {
          event = 'update';
        } else {
          event = 'add';
          remote.markAsKnownObject(object);
        }
      }

      remote.trigger(event, object);
      remote.trigger(event + ':' + object.type, object);
      remote.trigger(event + ':' + object.type + ':' + object.id, object);
      remote.trigger('change', event, object);
      remote.trigger('change:' + object.type, event, object);
      remote.trigger('change:' + object.type + ':' + object.id, event, object);
    }
  }


  // bootstrap known objects
  //
  if (options.knownObjects) {
    for (var i = 0; i < options.knownObjects.length; i++) {
      remote.markAsKnownObject({
        type: options.knownObjects[i].type,
        id: options.knownObjects[i].id
      });
    }
  }


  // expose public API
  return remote;
}

module.exports = hoodieRemoteStore;

