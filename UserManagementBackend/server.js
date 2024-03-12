require('dotenv').config

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');

});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});