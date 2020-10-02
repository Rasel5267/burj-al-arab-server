const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zsf87.mongodb.net/${process.env.DB_DBNAME}?retryWrites=true&w=majority`;

const port = 5000


const app = express()
app.use(cors());
app.use(bodyParser.json());


const serviceAccount = require("./config/burj-al-arab-authentication-firebase-adminsdk-bx74i-d0f51d7d4d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  app.post('/addBooking', (req, res) => {
      const newBooking = req.body;
      bookings.insertOne(newBooking)
      .then(data => {
          res.send(data.insertedCount > 0);
      })
      console.log(newBooking);
  })
	
   app.get('/bookings', (req, res) => {
	const bearer = req.headers.authorization;
	if(bearer && bearer.startsWith('Bearer ')){
	   const idToken = bearer.split(' ')[1];
	   admin.auth().verifyIdToken(idToken)
  	   .then(function(decodedToken) {
    	      let tokenEmail = decodedToken.email;
	      if(tokenEmail === req.query.email) {
		bookings.find({email: req.query.email})
		.toArray((err, documents) => {
	   	   res.send(documents);
		})
	      }
  	   }).catch(function(error) {
    	      res.send('un-authorized access')
  	   });

	}
	else{
	   res.send('un-authorized access')
	}
   })
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })