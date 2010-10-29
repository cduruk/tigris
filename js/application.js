var Tigris = Class.create({
  initialize: function(){
    //Feature Detection
    if (typeof(EventSource) != 'undefined') {
      Config.supportsEvents  = true;
    }
    if (window.location.search) {
        this.setupConfig(window.location.search);
    }
  },
  setupConfig: function(searchStr){
      var setupObj = searchStr.parseQuery();
      if (setupObj.max) {
          Config.maxItems = +setupObj.max;
      }
  },
  doEventStreaming: function(){
    var source       = new EventSource(Config.eventSourceURL);
    source.onmessage = function(event) {
      if (Config.goOn) {
        var result = event.data.evalJSON();
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
  updateList : function(result) {
    var tigItem = new TigrisItem(result);
    if(Filters.isOK(tigItem)) {
      tigItem.createElement();
      if ($$('.tigris-item-wrapper').length > Config.maxItems) {
        $$('.tigris-item-wrapper').last().remove();
      }
      allItems.push(tigItem);
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
  eventSourceURL : '/digg/stream?format=event-stream&types=submission,digg',
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
    if (this.queryFilter == null || this.queryFilter.length == 0) {
        return true;
    }
    var query = this.queryFilter.toLowerCase();
    return needle.title.toLowerCase().include(query) || needle.description.toLowerCase().include(query);
  },
  isUserFilter: function(needle) {
    if (this.userFilter == null || this.userFilter.length == 0) {
        return true;
    }
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
      //TODO: Think about this...
      if (item.item.id == needle.item.id) {
        isDupe = true;
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
    initialize: function(payload) {
        this.type = payload.type;
        this.user = new DiggUser(payload.user);
        this.item = new DiggStory(payload.item);
        if (this.type === 'comment') {
            this.comment = new DiggComment(payload.text, payload.diggs, payload.buries, payload.date_created);
        }
        this.id = this.type + "-" + this.item.id;
    },
    setType: function(itemType) {
        this.itemType = itemType;
    },
    setUser: function(user) {
        this.user = user;
    },
    setItem: function(item) {
        this.item = item;
    },
    createElement: function() {
        var resultDOM = null;
        var wrapper = new Element('li',   {'class' : 'tigris-item-wrapper', 'id' : this.id});

        switch(this.type) {
            case 'submission':
                resultDOM = this.getSubmissionDOM(); break;
            case 'digg':
                resultDOM = this.getDiggDOM(); break;
            case 'comment':
                resultDOM = this.getCommentDOM(); break;
        }

        resultDOM = wrapper.insert({top:resultDOM});
        this.addToList(resultDOM);
        this.handleMouseOver();
    },
    handleMouseOver: function() {
        $(this.id).on('mouseover', function(){
           $(this.id).addClassName('hovered');
           Config.goOn = false;
         });

        $(this.id).on('mouseout', function(){
           $(this.id).removeClassName('hovered');
           Config.goOn = true;
           if (!Config.supportsEvents) {
               t.doLongPolling();
           }
        });
    },
    addToList: function(payload) {
        payload.setStyle('overflow:hidden');
        $('items').insert({top: payload});

        var h = payload.getHeight();
        payload.setStyle('height:0px');
        payload.morph('height:'+h+'px',{ duration: .3 });

    },
    getSubmissionDOM: function() {
        var div     = new Element('div');
        var span    = this.user.getActivityDOM('submission');
        var itemDOM = this.item.getDOM();

        div.insert({top : span});
        div.insert(itemDOM);

        return div;
    },
    getDiggDOM: function() {
        var div     = new Element('div');
        var span    = this.user.getActivityDOM('digg');
        var itemDOM = this.item.getDOM();

        div.insert({top : span});
        div.insert(itemDOM);

        return div;
    }
});

var DiggStory = Class.create({
  initialize: function(payload) {
    this.id          = payload.id;
    this.description = payload.description;
    this.title       = payload.title;
    this.diggs       = payload.diggs;
    this.diggLink    = payload.href;
    this.realLink    = payload.link;
  },
  getDOM: function() {
    var item  = new Element('div',  {'class' : 'tigris-item', 'data-tigris-digg-id' : this.id});
    var title = new Element('span', {'class' : 'item title'}).update(this.title);
    var link  = new Element('a',    {'class' : 'item real-link', 'href' : this.realLink}).update(title);
    var space = new Element('span', {'class' : 'empty space'}).update('&nbsp;&nbsp;')
    var dLink = new Element('a',    {'class' : 'item digg-link', 'href' : this.diggLink}).update('View on Digg');
    var desc  = new Element('p',    {'class' : 'item desc'}).update(this.description);

    item.insert(link);
    item.insert(space);
    item.insert(dLink);
    item.insert(desc);

    return item;
  },
  createElement: function() {
    var tItemDOM = this.getDOM();

    $('items').insert({top: tItemDOM});
    tItemDOM.setStyle('overflow:hidden');

    var h = tItemDOM.getHeight();
    tItemDOM.setStyle('height:0px');
    tItemDOM.morph('height:'+h+'px',{ duration: .3 });

    $(this.id).on('mouseover', function(){
       $(this.id).addClassName('hovered');
       Config.goOn = false;
     });

    $(this.id).on('mouseout', function(){
       $(this.id).removeClassName('hovered');
       Config.goOn = true;
       if (!Config.supportsEvents) {
           t.doLongPolling();
       }
    });
  }
});

var DiggComment = Class.create({
    initialize: function(text, diggs, buries, date_created) {
        this.text = text;
        this.buries = buries;
        this.diggs = diggs;
        this.timestamp = date_created;
    }
})

var DiggUser = Class.create({
  initialize: function(payload) {
    this.fullname = payload.fullname;
    this.username = payload.name;
    this.iconURL  = payload.icon;
  },
  getDOM: function() {
    var user     = new Element('div', {'class' : 'tigris-user', 'data-tigris-digg-userid' : this.id});
    var username = new Element('p',   {'class' : 'user username', 'title' : this.fullname}).update(this.username);
    var usericon = new Element('img', {'class' : 'user icon', 'src' : this.iconURL, 'width' : '24px', 'height' : '24px'});

    user.insert(username);
    user.insert(usericon);

    return user;
  },
  getUserLink: function() {
      return "http://digg.com/" + this.username;
  },
  getActivityDOM: function(type) {
      var span  = new Element('span', {'class' : 'userline'});
      var ulink = new Element('a',    {'class' : 'userlink', 'href' : this.getUserLink()}).update(this.username);
      var div   = new Element('div');

      span.insert({top :  ulink});
      switch (type){
          case 'submission':
            span.update(span.innerHTML + ' just submitted this!'); break;
          case 'comment':
            span.update(span.innerHTML + ' just left a comment!'); break;
          case 'digg':
            span.update(span.innerHTML + ' just dugg this!'); break;
      }
      return span;
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
        label.update('Filter by Keyword'); break;
      case 'user':
        label.update('Filter by Username'); break;
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