var type,  format, sourceURL;
type      = 'all';
format    = 'event-stream';
sourceURL = '/digg/stream?' + "&format=" + format;

var filterWord = 'toxic';

var allItems = new Array();
var counter = 0;
var source = new EventSource(sourceURL);

//Class Definitions
var TigrisItem = Class.create({
  initialize: function(id, itemType, timestamp, description, title) {
    this.id          = id;
    this.itemType    = itemType;
    this.timestamp   = timestamp;
    this.description = description;
    this.title       = title;
  }
});

var DiggUser = Class.create({
  initialize: function(fullname, username, iconURL) {
    this.fullname = fullname;
    this.username = username;
    this.iconURL  = iconURL;
  }
});

var QuerySelector = Class.create({
  initialize: function(itemID) {
    this.itemID = itemID;
  },
  changeFilter: function() {
    var newFilter = $(this.itemID).getValue();
    console.log(newFilter);
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
  if (query.length == 0) {
    return true;
  }
  return needle.title.include(query) || needle.description.include(query);
}

source.onmessage = function(event) {
  var result = event.data.evalJSON();
  var tItem  = new TigrisItem(result.item.id, result.type, result.date, result.item.description, result.item.title);
  var tUser  = new DiggUser(result.user.fullname, result.user.username, result.user.icon);

  if(counter < 50 && isInFilter(filterWord, tItem))  {
      var item  = new Element('li', {'data-tigris-digg-id' : tItem.id});
      var title = new Element('p',  {'class' : 'item title'}).update(tItem.title);
      var desc  = new Element('p',  {'class' : 'item desc'}).update(tItem.description);

      var user     = new Element('div', {'data-tigris-digg-userid' : tUser.id});
      var userfull = new Element('p',   {'class' : 'user fullname'}).update(tUser.fullname);
      var username = new Element('p',   {'class' : 'user username'}).update(tUser.username);
      var usericon = new Element('img', {'class' : 'user icon', 'src' : tUser.iconURL});

      if (!doesExist(tItem) && isInFilter(filterWord, tItem)) {
        item.insert(title);
        item.insert(desc);

        user.insert(userfull);
        user.insert(username);
        user.insert({top : usericon});

        item.insert(user);

        $('items').insert({top: item});

        counter++;
        allItems.push(tItem);
        console.log(result);
      } //doesExist

  } //counter
};
