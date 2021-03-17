const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

//database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://ajqbnlopportmc:2d1426edcff6f185c3b502e66c034892eb1ab5cd0aa8bdebf7226ee1b806f038@ec2-54-164-22-242.compute-1.amazonaws.com:5432/d9nb3kbis4vrdu',
  ssl: {
    rejectUnauthorized: false
  }
});

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
function signIn(req, resp) {
  const username = req.body.username;
  const password = req.body.password;
  let values = [username, password]
  console.log("UN: " + username);
  console.log("PW: " + password);
  let sql = 'SELECT * FROM users WHERE user_username = $1 AND user_password = $2'

  pool.query(sql, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
      // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
      if (!res.rows[0]) {
        console.log("empty");
        resp.render('pages/index');
      }
      else {
        console.log("found")
        let r = res.rows[0]
        resp.render('pages/newsfeed');

      }
    }
  })
}
