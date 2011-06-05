var express = require('express');
var app     = module.exports = express.createServer();
var http    = require('http');
var url     = require('url');

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.set('view options', {
    layout: false
  });
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var port = process.env.PORT || 3000

app.get('/', function(req, res){
  res.render('index', {layout:false});
});

app.get('/digg/stream', function(req, res){

  var myQ = url.parse(req.url);

  var options = {
    host: 'services.digg.com',
    port: 80,
    path: '/2.0/stream' + '?' + myQ.query
  };

  var myReq = http.request(options, function(myRes) {
    if (options.path.indexOf('event-stream')) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream'});
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json'});
    }
    myRes.on('data', function (chunk) {
      res.write(chunk);
    });
  });

  myReq.end();

})

app.listen(port);
console.log("Express server listening on port %d", app.address().port);
