const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

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
app.get("/", (req, res) => {
    res.send("meal nest server is running");
  });
  

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





  app.listen(port, () => {
    console.log(
      `meal nest Server is running on port: ${port}, ${process.env.DB_USER},${process.env.DB_PASS} `
    );
  });
  