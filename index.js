const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
let userList = [];
//database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
var allUsers = [];
//start server
express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.urlencoded())
  .use(express.json())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users');
      const results = { 'results': (result) ? result.rows : null};

      userList = results;
      res.render('pages/db', userList );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/signIn', signIn)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


/*-----------Functions-----------*/
function signIn(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  console.log("UN: " + username);
  console.log("PW: " + password);
  console.log(userList);
  var query = 'SELECT * FROM users WHERE user_username = ' + username + ' AND user_password = ' + password; 
  res.render('pages/newsfeed');

}
