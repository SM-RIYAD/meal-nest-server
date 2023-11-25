const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;

app.use(
    cors({
      origin: ["http://localhost:5173","https://job-sphere.web.app","https://job-sphere.firebaseapp.com"],
      credentials: true,
    })
  );
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wacbf1n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  

  const dbConnect = async () => {
    try {
      await client.connect();
      console.log("Database Connected!");
    } catch (error) {
      console.log(error.name, error.message);
    }
  };
  dbConnect();

  const allMealsCollection = client.db("mealNest").collection("allmeals");
  const userCollection = client.db("mealNest").collection("users");
  const UpcomingMealsCollection = client.db("mealNest").collection("upcomingmeals");

app.get("/", (req, res) => {
    res.send("meal nest server is running");
  });
  
///getting all meals api
  app.get("/meals", async (req, res) => {
    // console.log(req.query.email);
    // console.log("token owner info", req.user);
    // if (req.user.email !== req.query.email) {
    //   return res.status(403).send({ message: "forbidden access" });
    // }
    // console.log("cookies test", req.cookies);
    let query = {};
    // if (req.query?.email) {
    //   query = { useremail: req.query.email };
    // }
    const result = await allMealsCollection.find(query).toArray();
    res.send(result);
  });

///adding user api
app.post('/users', async (req, res) => {
    const user = req.body;
    // insert email if user doesnt exists: 
    // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
    console.log("user for debug req",user)
    const query = { email: user?.email }
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: 'user already exists', insertedId: null })
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  });

///checking admin api

app.get('/users/admin/:email', async (req, res) => {
    const email = req.params.email;

    // if (email !== req.decoded.email) {
    //   return res.status(403).send({ message: 'forbidden access' })
    // }

    const query = { email: email };
    const user = await userCollection.findOne(query);
    let admin = false;
    if (user) {
      admin = user?.role === 'admin';
    }
    res.send({ admin });
  })

///get all the users 


app.get('/users', async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result);
});

///make admin api
app.patch('/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
})
///adding meal api
app.post("/addmeal", async (req, res) => {
  const newmeal = req.body;
  console.log(newmeal);
  const result = await allMealsCollection.insertOne(newmeal);
  res.send(result);
});


///adding  upcoming meal api
app.post("/addtoupcomingmeal", async (req, res) => {
  const newmeal = req.body;
  console.log(newmeal);
  const result = await UpcomingMealsCollection.insertOne(newmeal);
  res.send(result);
});

///get a specific meal

app.get("/specificmeal/:id", async (req, res) => {
  const id = req.params.id;

  // console.log(" update id: ", id);
  const query = { _id: new ObjectId(id) };
  const result = await allMealsCollection.findOne(query);
  console.log("to see details meal", result);
  res.send(result);
});
///update a meal api
app.put("/updatemeal/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const newmealtoUpdate = req.body;
  console.log("from body update", newmealtoUpdate);
  const newmeal = {

    mealTitle:newmealtoUpdate.mealTitle,
    mealType:newmealtoUpdate.mealType ,
    mealImage:newmealtoUpdate.mealImage,
    ingredients:newmealtoUpdate.ingredients,
    description: newmealtoUpdate.description,
    price:newmealtoUpdate.price,
    rating:newmealtoUpdate.rating,
    time:newmealtoUpdate.time,
  
    likes:newmealtoUpdate.likes,
    reviews:newmealtoUpdate.reviews,
    adminName:newmealtoUpdate.adminName,
    adminEmail:newmealtoUpdate. adminEmail

 
  };
  console.log("new meal", newmeal);
  const meal = {
    $set: {
     
    mealTitle:newmealtoUpdate.mealTitle,
    mealType:newmealtoUpdate.mealType ,
    mealImage:newmealtoUpdate.mealImage,
    ingredients:newmealtoUpdate.ingredients,
    description: newmealtoUpdate.description,
    price:newmealtoUpdate.price,
    rating:newmealtoUpdate.rating,
    time:newmealtoUpdate.time,
  
    likes:newmealtoUpdate.likes,
    reviews:newmealtoUpdate.reviews,
    adminName:newmealtoUpdate.adminName,
    adminEmail:newmealtoUpdate. adminEmail
    },
  };

  const result = await allMealsCollection.updateOne(filter, meal, options);
  console.log("updated obj", result);
  res.send(result);
});


  app.listen(port, () => {
    console.log(
      `meal nest Server is running on port: ${port}, ${process.env.DB_USER},${process.env.DB_PASS} `
    );
  });
  