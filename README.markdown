Tigris
======

Tigris is a sample application whipped together to showcase [Digg](http://digg.com)'s new
Streaming API.

Setup
-----

It expects a browser that supports the [Server-Sent events]
(http://dev.w3.org/html5/eventsource/). As of
this writing, Tigris works with Safari 5, Chrome 7+. It probably works
with Firefox 4.

It currently expects server-sent events be sent from `/digg/stream`. It is
currently written using a small Node.JS proxy for cross-domain requests.

TODO
----

* Make the maximum number configurable (hash? from the page?)
* Highlight the search terms.
* Make it a lot less ugly.

License
-------

(The MIT License)

Copyright (c) 2010 Can Duruk

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Misc.
-----

It is named after a Tigris river because I'm from Turkey and rivers stream.