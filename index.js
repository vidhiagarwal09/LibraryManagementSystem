const express = require("express");
const z = require("zod");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./Models/User");
const Authjwt = require("./Middleware/Authjwt.cjs");
const Books = require("./Models/Books");
app.use(cors());
app.use(express.json());
require("dotenv").config();
mongoose.connect(
  "mongodb+srv://abhishekkanwasikannu15103:7fPcitsQejUwaAKM@cluster0.ooddb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);
const userdata = z.object({
  email: z.string().email(),
  password: z.string().min(5).max(25),
  role: z.enum(["user", "admin"]),
  name: z.string(),
});

app.post("/user/signup", async (req, res) => {
  const { email, password, role, name } = req.body;
  const result = userdata.safeParse({ email, password, role, name });
  if (result.success) {
    try {
      let user = await User.findOne({ email });
      if (user) {
        res.status(403).send({ message: "User already exists" });
        return;
      }
      user = new User({ email, password, role, name });
      await user.save();
      const token = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWTSECRET
      );
      return res.json({ msg: "user created", user, token });
    } catch (e) {
      res.send(e);
    }
  } else {
    res.send(result.error);
  }
});

app.post("/user/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).send({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWTSECRET
    );
    return res.json({ msg: "User signed in", user, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.json(user);
  } catch (e) {
    res.status(500).send(e);
  }
});
app.post("/addBook", Authjwt, async (req, res) => {
  if (req.user.role != "admin") {
    return res.json({ msg: "not an admin" });
  }
  const { title, author, genre, publishedDate, price, date } = req.body;
  const book = new Books({ title, author, genre, publishedDate, price, date });
  await book.save();
  return res.json(book);
});
app.listen(8000, () => {
  console.log("Server is listening on port 8000");
});
