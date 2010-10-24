var Tigris = Class.create({
  initialize: function(){
    if (typeof(EventSource) != 'undefined') {
      Config.supportsEvents  = true;
    }
  },
  doEventStreaming: function(){
    var source       = new EventSource(Config.eventSourceURL);
    source.onmessage = function(event) {
      var result     = event.data.evalJSON();
      this.updateList(result);
    }.bind(this);
  },
  doLongPolling : function() {
    new Ajax.Request(Config.longPollURL,
      {
        method:'get',
        onComplete: function(transport){
          var response = transport.responseText;
          var result   = response.evalJSON();
          this.updateList(result);
          this.doLongPolling();
        }.bind(this)
      });
  },
  updateList : function(result) {
    var tItem  = new TigrisItem(result.item.id, result.type, result.date, result.item.description, result.item.title, result.item.diggs);
    var dUser  = new DiggUser(result.user.fullname, result.user.name, result.user.icon);
    tItem.setUser(dUser);

    if(Filters.isOK(tItem)) {
      var tItemDOM = tItem.getDOM();
      var dUserDOM = dUser.getDOM();

      tItemDOM.insert(dUserDOM);

      $('items').insert({top: tItemDOM});

      Filters.counter++;
      allItems.push(tItem);
    }
  },
  run: function() {
    if (Config.supportsEvents) {
        this.doEventStreaming();
      } else {
        this.doLongPolling();
    }
  }
});

var Config = {
  eventSourceURL : '/digg/stream?format=event-stream',
  longPollURL    : '/digg/stream?return_after=1',
  supportsEvents : false,
  maxItems       : 50
};

var allItems = new Array();

// Modules
var Filters = {
  userFilter  : '',
  queryFilter : '',
  counter     : 0,

  setUserFilter: function(newValue) {
    this.userFilter = newValue;
  },
  setQueryFilter: function(newValue) {
    this.queryFilter = newValue;
  },
  isQueryFilter: function(needle) {
    var query = this.queryFilter.toLowerCase();
    return needle.title.toLowerCase().include(query) || needle.description.toLowerCase().include(query);
  },
  isUserFilter: function(needle) {
    return needle.user.username.toLowerCase() == this.userFilter;
  },
  isFilter: function(needle) {
    if ((this.userFilter == null || this.userFilter.length == 0) && (this.queryFilter == null || this.queryFilter.length == 0)) {
      return true;
    }
    return this.isUserFilter(needle) && this.isQueryFilter(needle);
  },
  //This is necessary because submissions come as diggs too
  doesExist: function(needle) {
    var isDupe = false;
    allItems.each(function(item) {
      if (item.id == needle.id) {
        isDupe = true;;
      }
    });
    return isDupe;
  },
  isOK: function(needle) {
    return this.isFilter(needle) && !this.doesExist(needle) && this.counter < Config.maxItems;
  }
};

//Class Definitions
var TigrisItem = Class.create({
  initialize: function(id, itemType, timestamp, description, title, diggs, user) {
    this.id          = id;
    this.itemType    = itemType;
    this.timestamp   = timestamp;
    this.description = description;
    this.title       = title;
    this.diggs       = diggs;
    this.user        = null;
  },
  setUser: function(user) {
    this.user = user;
  },
  getDOM: function() {
    var item  = new Element('li', {'class' : 'tigris-item', 'data-tigris-digg-id' : this.id});
    var title = new Element('p',  {'class' : 'item title'}).update(this.title);
    var desc  = new Element('p',  {'class' : 'item desc'}).update(this.description);

    item.insert(title);
    item.insert(desc);

    return item;
  }
});

var DiggUser = Class.create({
  initialize: function(fullname, username, iconURL) {
    this.fullname = fullname;
    this.username = username;
    this.iconURL  = iconURL;
  },
  getDOM: function() {
    var user     = new Element('div', {'class' : 'tigris-user', 'data-tigris-digg-userid' : this.id});
    var userfull = new Element('p',   {'class' : 'user fullname'}).update(this.fullname);
    var username = new Element('p',   {'class' : 'user username'}).update(this.username);
    var usericon = new Element('img', {'class' : 'user icon', 'src' : this.iconURL});

    user.insert(userfull);
    user.insert(username);
    user.insert({top : usericon});

    return user;
  }
});

var Filter = Class.create({
  initialize: function(itemID, fType, targetFilter) {
    this.itemID = itemID;
    this.fType  = fType;
  },
  changeFilter: function() {
    var newFilter = $(this.itemID).getValue();
    switch(this.fType) {
      case 'query':
        Filters.setQueryFilter(newFilter); break;
      case 'user':
        Filters.setUserFilter(newFilter); break;
    }
  },
  createElement: function() {
    var el = new Element('input', {'id' : this.itemID, 'class' : 'filter ' + this.fType, 'type' : 'text'});
    $('filters').insert(el);
    $(this.itemID).observe('keyup', this.changeFilter.bind(this));
  },
});

document.observe("dom:loaded", function() {
  var qf = new Filter('query-filter', 'query');
  var uf = new Filter('user-filter', 'user');

  qf.createElement();
  uf.createElement();
});

var t = new Tigris();
t.initialize();
t.run();