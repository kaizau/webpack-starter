var port = process.env.PORT || 5000;
var express = require('express');
var server = express();

server.use(express.static(__dirname + '/public'));
server.listen(port);
