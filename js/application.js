var type,  format, sourceURL;
type      = 'all';
format    = 'event-stream';
sourceURL = '/digg/stream?' + "&format=" + format;

var filterWord = '';

var allItems = new Array();
var counter  = 0;
var source   = new EventSource(sourceURL);

//Class Definitions
var TigrisItem = Class.create({
  initialize: function(id, itemType, timestamp, description, title, diggs) {
    this.id          = id;
    this.itemType    = itemType;
    this.timestamp   = timestamp;
    this.description = description;
    this.title       = title;
    this.diggs       = diggs;
  },
  getDOM: function() {
    var item  = new Element('li', {'data-tigris-digg-id' : this.id});
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
    var user     = new Element('div', {'data-tigris-digg-userid' : this.id});
    var userfull = new Element('p',   {'class' : 'user fullname'}).update(this.fullname);
    var username = new Element('p',   {'class' : 'user username'}).update(this.username);
    var usericon = new Element('img', {'class' : 'user icon', 'src' : this.iconURL});

    user.insert(userfull);
    user.insert(username);
    user.insert({top : usericon});

    return user;
  }
});

var QuerySelector = Class.create({
  initialize: function(itemID) {
    this.itemID = itemID;
  },
  changeFilter: function() {
    var newFilter = $(this.itemID).getValue();
    filterWord = newFilter;
  },
  createElement: function() {
    var el = new Element('input', {'id' : this.itemID, 'class' : 'filter query', 'type' : 'text'});
    $('filters').insert(el);
    $(this.itemID).observe('keyup', this.changeFilter.bind(this))
  },
});

document.observe("dom:loaded", function() {
  var qs = new QuerySelector('query-filter');
  qs.createElement();
});

function doesExist(needle) {
  var isDupe = false;
  allItems.each(function(item) {
    if (item.id == needle.id) {
      isDupe = true;;
    }
  });
  return isDupe;
};

function isInFilter(query, needle) {
  if (query == null || query.length == 0) {
    return true;
  }
  var query = query.toLowerCase();
  return needle.title.toLowerCase().include(query) || needle.description.toLowerCase().include(query);
}

source.onmessage = function(event) {
  var result = event.data.evalJSON();
  var tItem  = new TigrisItem(result.item.id, result.type, result.date, result.item.description, result.item.title, result.item.diggs);
  var dUser  = new DiggUser(result.user.fullname, result.user.name, result.user.icon);

  if(counter < 50 && isInFilter(filterWord, tItem))  {
      if (!doesExist(tItem) && isInFilter(filterWord, tItem)) {
        var tItemDOM = tItem.getDOM();
        var dUserDOM = dUser.getDOM();

        tItemDOM.insert(dUserDOM);

        $('items').insert({top: tItemDOM});

        counter++;
        allItems.push(tItem);
        console.log(result);
      } //doesExist

  } //counter
};
