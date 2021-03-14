const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/signIn', signIn)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


/*-----------Functions-----------*/
function signIn(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  console.log("UN:" + username);
  console.log("PW: " + password);
}
