const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

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
      res.render('pages/db', results );
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
  pool.connect((err, client, done) => {
    if (err) throw err
    client.query('SELECT * FROM users WHERE user_username = $1 AND user_password = $2', [username, password], (err, res) => {
      done()
      if (err) {
        console.log(err.stack)
      } else {
        console.log(res.rows[0])
      }
    })
  })
  res.render('pages/newsfeed')
}
