const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;
app.use(cookieParser());
///middlewires
app.use(
    cors({
      origin: ["http://localhost:5173","https://meal-nest.web.app","https://meal-nest.firebaseapp.com/"],
      credentials: true,
    })
  );



  const logger = (req, res, next) => {
    console.log("log: info", req.method, req.url);
    next();
  };
///verify token
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  // no token available
  if (!token) {
    console.log("we didnt get any token!")
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
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
  const ReviewCollection = client.db("mealNest").collection("Reviews");

  const RequestedMealsCollection = client.db("mealNest").collection("requestedmeals");
app.get("/", (req, res) => {
    res.send("meal nest server is running");
  });



///auth related api
app.post("/jwt",logger, async (req, res) => {
  const user = req.body;
  console.log("user for token after login", user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  console.log("this is the token made in login",token)
 res.cookie(
    "token",
    token,
    {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true: false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }
    )
  
    .send({ success: true });
});



////LOG OUT
app.post("/logout", async (req, res) => {
  const user = req.body;
  console.log("logging out", user);

  // clearCookie('token', { maxAge: 0 }).
  res.clearCookie(
    "token",
    {
    maxAge: 0,
    secure: process.env.NODE_ENV === "production" ? true: false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }
    ).send({ success: true })

  // res.clearCookie("token", {
  //   maxAge: 0,
  //   secure: process.env.NODE_ENV === "production" ? true : false,
  //   sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  // });
});



  ///get count for all meals
  app.get('/AllmealsCount', async (req, res) => {
    const count = await allMealsCollection.estimatedDocumentCount();
    res.send({ count });
  })

///get count for all reviews

app.get('/AllreviewsCount', async (req, res) => {
  try {
    let query = {};
    if (req.query?.mealid) {
      query = { reviewdmeal_id: req.query.mealid };
    }
    if (req.query?.email) {
      query = { reviewgiversEmail: req.query.email };
    }

    const count = await ReviewCollection.countDocuments(query);
    res.send({ count });
  } catch (error) {
    console.error("Error counting reviews:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

///getting review page
app.get("/reviews",verifyToken, async (req, res) => {
  // console.log(req.query.email);
  // console.log("token owner info", req.user);
  // if (req.user.email !== req.query.email) {
  //   return res.status(403).send({ message: "forbidden access" });
  // }
  // console.log("cookies test", req.cookies);
  console.log( "this is review  title",req.query.mealid);
  let query = {};
  if (req.query?.mealid) {
    query = { reviewdmeal_id: req.query.mealid };
  }
  if (req.query?.email) {
    query = { reviewgiversEmail: req.query.email };
  }

  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);


  const result = await ReviewCollection.find(query).skip(page * size)
  .limit(size).toArray();
  res.send(result);
});

/// get count for requested meals api 
app.get('/requestedMealsCount', async (req, res) => {
  try {
    let query = {};
    if (req.query?.email) {
      query = { requestedUsersEmail: req.query?.email };
    }
    const count = await RequestedMealsCollection.countDocuments(query);
    res.send({ count });
  } catch (error) {
    console.error("Error counting requested meals:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


/// getting requested meals api

app.get("/requestedmeals", async (req, res) => {
  // console.log(req.query.email);
  // console.log("token owner info", req.user);
  // if (req.user.email !== req.query.email) {
  //   return res.status(403).send({ message: "forbidden access" });
  // }
  // console.log("cookies test", req.cookies);
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  console.log( "this is requested users email",req.query.email);
  let query = {};
  if (req.query?.email) {
    query = { requestedUsersEmail: req.query?.email };
  }
  // if (req.query?.email) {
  //   query = { useremail: req.query.email };
  // }
  const result = await RequestedMealsCollection.find(query).skip(page * size)
  .limit(size).toArray();
  res.send(result);
});


  ///get count for all users
  app.get('/AllUsersCount', async (req, res) => {
    const count = await userCollection.estimatedDocumentCount();
    res.send({ count });
  })
///get count upcomingmeals
app.get('/AllUpcomingmealsCount', async (req, res) => {
  const count = await userCollection.estimatedDocumentCount();
  res.send({ count });
})

///get all the users 


app.get('/users', async (req, res) => {
  const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
  const result = await userCollection.find().skip(page * size)
  .limit(size).toArray();
  res.send(result);
});

///updating about me api
app.patch('/update/aboutme/:id', async (req, res) => {


  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const newaboutmeToUpdate = req.body;
  console.log("from body update", newaboutmeToUpdate);

  // console.log("new meal", newmeal);
  const review = {
    $set: {
     
      aboutme: newaboutmeToUpdate.aboutme
    },
  };

  const result = await userCollection.updateOne(filter, review, options);
  console.log("updated obj", result);
  res.send(result);

});

  
///getting all meals api
  app.get("/meals", async (req, res) => {
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    // console.log(req.query.reviwedmeal);
    // console.log("token owner info", req.user);
    // if (req.user.email !== req.query.email) {
    //   return res.status(403).send({ message: "forbidden access" });
    // }
    // console.log("cookies test", req.cookies);
    let query = {};
    // if (req.query.reviwedmeal) {
    //   query = { mealTitle: req.query.reviwedmeal };
    // }
    const result = await allMealsCollection.find(query).skip(page * size)
    .limit(size).toArray();
    res.send(result);
  });

  ///getting all upcoming meals api
  app.get("/upcomingmeals", async (req, res) => {


    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);

    // console.log(req.query.reviwedmeal);
    // console.log("token owner info", req.user);
    // if (req.user.email !== req.query.email) {
    //   return res.status(403).send({ message: "forbidden access" });
    // }
    // console.log("cookies test", req.cookies);
    let query = {};
    // if (req.query.reviwedmeal) {
    //   query = { mealTitle: req.query.reviwedmeal };
    // }
    const result = await UpcomingMealsCollection.find(query).skip(page * size)
    .limit(size).toArray();
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


  ///adding requested meals api
 
app.post("/addrequestedmeal", async (req, res) => {
  const newmeal = req.body;
  console.log(newmeal);
  const result = await RequestedMealsCollection.insertOne(newmeal);
  res.send(result);
});


/// cancelling requested meal api
app.delete("/deleteRequestedMeal/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await RequestedMealsCollection.deleteOne(query);
  console.log(result);
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


///check specific user has a package or not api
app.get("/checkHasPackage/:email", async (req, res) => {
  const email = req.params.email;

  // if (email !== req.decoded.email) {
  //   return res.status(403).send({ message: 'forbidden access' })
  // }

  const query = { email: email };
  const user = await userCollection.findOne(query);
  let DontHasPackage =false;
  if (user) {
    DontHasPackage = user?.badge === 'bronze';
  }
  res.send({ DontHasPackage});
  // res.send(result);
});



///get a specific user api
app.get("/specificUser/:email", async (req, res) => {
  const email = req.params.email;
console.log("this email is for user details",email)
  // if (email !== req.decoded.email) {
  //   return res.status(403).send({ message: 'forbidden access' })
  // }

  const query = { email: email };
  const user = await userCollection.findOne(query);
  // let DontHasPackage =false;
  // if (user) {
  //   DontHasPackage = user?.badge === 'bronze';
  // }
  res.send({ user });
  // res.send(result);
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



///updating a review api



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


///adding   meal review api
app.post("/addreview", async (req, res) => {
  const reviewinfo = req.body;
  console.log(reviewinfo);
  const result = await ReviewCollection.insertOne(reviewinfo);
  res.send(result);
});




// /update review content
app.put("/update/reviewtext/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const newreviewtoUpdate = req.body;
  console.log("from body update", newreviewtoUpdate);

  // console.log("new meal", newmeal);
  const review = {
    $set: {
     
      reviewcontent: newreviewtoUpdate.reviewcontent
    },
  };

  const result = await ReviewCollection.updateOne(filter, review, options);
  console.log("updated obj", result);
  res.send(result);
});







/// getting requested meals api

app.get("/requestedmeals", async (req, res) => {
  // console.log(req.query.email);
  // console.log("token owner info", req.user);
  // if (req.user.email !== req.query.email) {
  //   return res.status(403).send({ message: "forbidden access" });
  // }
  // console.log("cookies test", req.cookies);
  console.log( "this is requested users email",req.query.email);
  let query = {};
  if (req.query?.email) {
    query = { requestedUsersEmail: req.query?.email };
  }
  // if (req.query?.email) {
  //   query = { useremail: req.query.email };
  // }
  const result = await RequestedMealsCollection.find(query).toArray();
  res.send(result);
});

///update review count api
app.get("/updatereviewcount/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  // const jobdata = req.body;
  // console.log(jobdata);
  const updatedmealdata = {
    $inc: {
      // status: updatedBooking.status
      reviews: 1,
    },
  };
  const result = await allMealsCollection.updateOne(filter,updatedmealdata);
  console.log("result from update", result);
  res.send(result);
});

///update like count

app.get("/updatelikecount/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  // const jobdata = req.body;
  // console.log(jobdata);
  const updatedmealdata = {
    $inc: {
      // status: updatedBooking.status
      likes: 1,
    },
  };
  const result = await allMealsCollection.updateOne(filter,updatedmealdata);
  console.log("result from update", result);
  res.send(result);
});

///update like count in upcoming meals

app.get("/updatelikecountInUpcomingMeals/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  // const jobdata = req.body;
  // console.log(jobdata);
  const updatedmealdata = {
    $inc: {
      // status: updatedBooking.status
      likes: 1,
    },
  };
  const result = await UpcomingMealsCollection.updateOne(filter,updatedmealdata);
  console.log("result from update", result);
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
    adminEmail:newmealtoUpdate. adminEmail,
    likeEmail:newmealtoUpdate.likeEmail

 
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
    adminEmail:newmealtoUpdate. adminEmail,likeEmail:newmealtoUpdate.likeEmail
    },
  };

  const result = await allMealsCollection.updateOne(filter, meal, options);
  console.log("updated obj", result);
  res.send(result);
});
///update like email



 
///update a users badze api
app.put("/updateuserbadze", async (req, res) => {
  const userinfo = req.body;
  
  const filter = { email:userinfo.email };
  const options = { upsert: true };
  // const newmealtoUpdate = req.body;
  console.log("from body update", userinfo);
  // const newmeal = {
  // };
  // console.log("new meal", newmeal);
  const badge_info = {
    $set: {
      badge:userinfo.badge

    },
  };
  const result = await userCollection.updateOne(filter, badge_info, options);
  console.log("updated obj", result);
  res.send(result);
});

///update liked users email in  meal api

app.put("/update_like_email/:id", async (req, res) => {
  const mealinfo = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const options = { upsert: true };
  // const newmealtoUpdate = req.body;
  console.log("from body update", mealinfo);
  // const newmeal = {
  // };
  // console.log("new meal", newmeal);
  const likedemailinfo = {
    // $set: {
    //   likeEmail:mealinfo.likeEmail
    // }
    $push: { likeEmails: mealinfo.likeEmail } ,
  };
  const result = await allMealsCollection.updateOne(filter,likedemailinfo, options);
  console.log("updated obj", result);
  res.send(result);
});

///update liked users email in upcomingmeals
app.put("/update_like_email_in_Upcoming_meals/:id", async (req, res) => {
  const mealinfo = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const options = { upsert: true };
  // const newmealtoUpdate = req.body;
  console.log("from body update", mealinfo);
  // const newmeal = {
  // };
  // console.log("new meal", newmeal);
  const likedemailinfo = {
    // $set: {
    //   likeEmail:mealinfo.likeEmail
    // }
    $push: { likeEmails: mealinfo.likeEmail } ,
  };
  const result = await UpcomingMealsCollection.updateOne(filter,likedemailinfo, options);
  console.log("updated obj", result);
  res.send(result);
});

/// update requested meal status api

app.put("/update_requested_meal_status/:id", async (req, res) => {
  const mealinfo = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const options = { upsert: true };
  // const newmealtoUpdate = req.body;
  console.log("from body update", mealinfo);
  // const newmeal = {
  // };
  // console.log("new meal", newmeal);
  // const likedemailinfo = {
  //   // $set: {
  //   //   likeEmail:mealinfo.likeEmail

  //       // }
  //   $push: { likeEmails: mealinfo.likeEmail } ,
  // };

  const requested_meal_info = {
    $set: {
      mealStatus:"delivered"

    }}
  const result = await RequestedMealsCollection.updateOne(filter,requested_meal_info, options);
  console.log("updated obj", result);
  res.send(result);
});

/// search from serve meal page from requested meals api
app.get('/api/search/in_servepage/:searchWord', async (req, res) => {
  const searchWord = req.params.searchWord;
console.log("this is search word from serve page",searchWord);

    const results = await RequestedMealsCollection.find({
      $or: [
        { requestedUsersEmail: { $regex: searchWord, $options: 'i' } },
        { requestedUsersName: { $regex: searchWord, $options: 'i' } },
      ],
    }).toArray();
res.send(results)
  
});

///delete a review api

app.delete("/deletereview/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await ReviewCollection.deleteOne(query);
  console.log(result);
  res.send(result);
});


///delete a meal api
app.delete("/deletemeal/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await allMealsCollection.deleteOne(query);
  console.log(result);
  res.send(result);
});
  // payment intent
  app.post('/create-payment-intent', async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    console.log(amount, 'amount inside the intent')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    })
  });
  app.listen(port, () => {
    console.log(
      `meal nest Server is running on port: ${port}, ${process.env.DB_USER},${process.env.DB_PASS} `
    );
  });
  