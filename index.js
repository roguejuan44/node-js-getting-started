const { sign } = require('crypto')
const { cache } = require('ejs')
const express = require('express')
const https = require('https')
const path = require('path')
const PORT = process.env.PORT || 5000
let signedInUser = "test"
let cachedPosts = ""


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
  //homepage
  .get('/', (req, res) => res.render('pages/index', {message :""}))
  //search my posts
  .get('/postsBy', async (req, res) => {
    let creator = req.query.creator;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM posts WHERE post_creator = ' + creator);
      const results = { 'results': (result) ? result.rows : null, user: signedInUser};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/control', (req, res) => res.render('pages/control', {user: signedInUser, message :""}))

  //sign in
  .post('/signIn', signIn)

  //register new user

  .post('/register', register)
  //set user location
  .post('/changeLocation', changeLocation)
  //view newsfeed
  .post('/newsfeed', getNewsfeed)
  //create new post
  .post('/newPost', createPost)

  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


/*-----------Functions-----------*/

function changeLocation(req, resp) {
  const id = req.body.id;
  const location = req.body.location;
  let sql = "UPDATE users SET user_location = $1 WHERE user_id = $2";
  let values = [location, id];

  console.log(location);
  pool.query(sql, values, (err, res) => {
    if (err) {
      console.log(err.stack)
      resp.render('pages/control', {user: signedInUser, message: "Error. Try again."})
    } else {
      signedInUser["user_location"] = location
      console.log(signedInUser["user_location"])
      resp.render('pages/control', {user: signedInUser, message: "Location Updated."})
    } 
  })
}

function register(req, resp) {
  const fName = req.body.fname;
  const lName = req.body.lname;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;
  const city = req.body.city;

  let sql = 'SELECT * FROM users WHERE user_username = $1';
  let values = [username, fName, lName, password, city];
  let oneValue = [username];

  pool.query(sql, oneValue, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      if (res.rows[0]) {
        resp.render('pages/index', {message :"A user with this username already exists"});
      }
      else {
        if (password == password2) {
          addNewUser(values)
          resp.render('pages/index', {message : "User registered successfully. Please sign in."})
        }
        else {
          resp.render('pages/index', {message : "The passwords do not match. Try again."})
        }
      }
    }
  })
}

function addNewUser(valuesU) {
  pool.connect((err, client, done) => {
    const shouldAbort = err => {
      if (err) {
        console.error('Error in transaction', err.stack)
        client.query('ROLLBACK', err => {
          if (err) {
            console.error('Error rolling back client', err.stack)
          }
          // release the client back to the pool
          done()
        })
      }
      return !!err
    }
    client.query('BEGIN', err => {
      if (shouldAbort(err)) return
      const queryText = 'INSERT INTO users (user_username, user_firstname, user_lastname, user_password, user_location) VALUES ($1, $2, $3, $4, $5) RETURNING user_id'
      client.query(queryText, valuesU, (err, res) => {
        if (shouldAbort(err)) return
        client.query('COMMIT', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })
      })
    })
  })
}

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
      if (!res.rows[0]) {
        resp.render('pages/index', {message :"Incorrect username or password"});
      }
      else {
        console.log("found")
        signedInUser = res.rows[0]
        resp.render('pages/control', {user: res.rows[0], message: ""});
      }
    }
  })
}

function getNewsfeed(req, resp) {
  const username = req.body.username;
  const id = req.body.id;
  const location = req.body.location;
  let sql = 'SELECT * FROM posts LEFT JOIN users ON posts.post_creator = users.user_id ORDER BY posts.post_date DESC'

  pool.query(sql, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
      // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
      if (!res.rows) {
        resp.render('pages/index', {message :"No posts found"});
      }
      else {
        console.log("found")
        cachedPosts = res.rows
        resp.render('pages/newsfeed', {posts: res.rows, user: signedInUser});

      }
    }
  })
}

function createPost(req, resp) {
  const id = req.body.id;
  const weather = req.body.postweather;
  const plocation = req.body.postlocation;
  const content = req.body.postcontent;
  const date = req.body.date;

    //insert into posts 
    //get new posts
  console.log(id + " hello: " + plocation);

  const text = "INSERT INTO posts(post_creator, post_weather, post_location, post_content, post_date) VALUES($1, $2, $3, $4, $5) RETURNING * "
  const values = [id, weather, plocation, content, date]

  pool.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
      // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
      if (!res.rows) {
        resp.render('pages/index', {message :"No posts found"});
      }
      else {
        cachedPosts.unshift(res.rows[0])
        cachedPosts.sort((a, b) => (a.post_date > b.post_date) ? 1 : 1)

        console.log(cachedPosts)
        console.log("found")
        resp.render('pages/newsfeed', {posts: cachedPosts, user: signedInUser});

      }
    }
  })
}

function getWeather(locate) {
    let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + locate + '&units=imperial&APPID=d7ffb76f27d5f75f6ce4b7817252176f'
    
    https.get(url, (resp) => {
      let data = '';
      console.log("ouch")
    
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(JSON.parse(data).name);
        console.log(JSON.parse(data).weather[0].main);

      });
    
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
}