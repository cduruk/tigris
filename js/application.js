var type,  format, sourceURL;
type      = 'all';
format    = 'event-stream';
sourceURL = '/digg/stream?' + 'type=' + type + "&format=" + format;

//debug
console.log(sourceURL)

var source = new EventSource(sourceURL);
source.onmessage = function(event) {
   //debug
   document.write(event.data);
};
