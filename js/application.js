var Tigris = Class.create({
  initialize: function(){
    //Feature Detection
    if (typeof(EventSource) != 'undefined') {
      Config.supportsEvents  = true;
    }
    var hashStr = window.location.hash;
    //Check if integer
    if (hashStr.length != 0 && hashStr.substring(1)%1 == 0) {
      Config.maxItems = hashStr.substring(1);
    }
  },
  doEventStreaming: function(){
    var source       = new EventSource(Config.eventSourceURL);
    source.onmessage = function(event) {
      if (Config.goOn) {
        var result     = event.data.evalJSON();
        this.updateList(result);
      }
    }.bind(this);
  },
  doLongPolling : function() {
      new Ajax.Request(Config.longPollURL,
        {
          method:'get',
          onComplete: function(transport){
            var response = transport.responseText;
            var result   = response.evalJSON();
            if (Config.goOn) {
              this.updateList(result);
              this.doLongPolling();
            }
          }.bind(this)
        });
  },
  //This method is too long :'(
  updateList : function(result) {
    var tItem  = new TigrisItem(result.item.id, result.type, result.date, result.item.description, result.item.title, result.item.diggs);
    var dUser  = new DiggUser(result.user.fullname, result.user.name, result.user.icon);
    tItem.setUser(dUser);

    if(Filters.isOK(tItem) && allItems.length < 40) {
      var tItemDOM = tItem.getDOM();
      var dUserDOM = dUser.getDOM();

      tItemDOM.insert({top:dUserDOM});

      $('items').insert({top: tItemDOM});

      $(tItem.id).on('mouseover', function(){
         $(tItem.id).addClassName('hovered');
         Config.goOn = false;
       });

      $(tItem.id).on('mouseout', function(){
         $(tItem.id).removeClassName('hovered');
         Config.goOn = true;
         t.doLongPolling();
      });

      if ($$('.tigris-item-wrapper').length > Config.maxItems) {
        $$('.tigris-item-wrapper').last().remove();
      }

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
  maxItems       : 15,
  goOn           : true
};

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
    return this.isFilter(needle) && !this.doesExist(needle);
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
    var cont  = new Element('li',  {'class' : 'tigris-item-wrapper', 'id' : this.id});
    var item  = new Element('div', {'class' : 'tigris-item', 'data-tigris-digg-id' : this.id});
    var title = new Element('p',   {'class' : 'item title'}).update(this.title);
    var desc  = new Element('p',   {'class' : 'item desc'}).update(this.description);

    item.insert(title);
    item.insert(desc);
    cont.insert({top:item});

    return cont;
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
    var username = new Element('p',   {'class' : 'user username', 'title' : this.fullname}).update(this.username);
    var usericon = new Element('img', {'class' : 'user icon', 'src' : this.iconURL});

    user.insert(username);
    user.insert(usericon);

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
    var label = new Element('label', {'for' : this.itemID});
    switch(this.fType) {
      case 'query':
        label.update('Filter Items'); break;
      case 'user':
        label.update('Filter Users'); break;
    }
    var el    = new Element('input', {'id' : this.itemID, 'name' : this.itemID, 'class' : 'filter ' + this.fType, 'type' : 'text'});
    $('filters').insert(label);
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

var allItems = new Array();
var t = new Tigris();

t.initialize();
t.run();