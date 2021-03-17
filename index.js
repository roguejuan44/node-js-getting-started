const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
let userList = {};
let message = "";
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
  //.get('/', (req, res) => res.render('pages/index'))
  .get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users');
      const results = { 'results': (result) ? result.rows : null};

      userList = results;
      res.render('pages/index');
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
  for(let i=0; i < userList.length; i++) {
    if (userlist[i][user_username] == username && userList[i][user_password] == password ) {
      res.render('pages/newsfeed');
    }
    else {
      message = "Incorrect username or password";
      res.render('pages/index');
    } 
  });
}
