const express = require('express');
const app = express();
 
express.static.mime.types['wasm'] = 'application/wasm'; 
app.use(express.static(__dirname + '/'));
app.listen(4000);
