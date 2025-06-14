//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
const dotEnv = require("dotenv");
dotEnv.config();
const dataBase = process.env.DATABASE;
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(dataBase);

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "You Must provide a NAME"],
  },
});
const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "You Must provide a NAME"],
  },
  items: [itemSchema],
});

const Item = mongoose.model("Item", itemSchema);
const Work = mongoose.model("Work", itemSchema);

//["Buy Food", "Cook Food", "Eat Food"]
const item1 = new Item({ name: "Buy Food" });
const item2 = new Item({ name: "Cook Food" });
const item3 = new Item({ name: "Eat Food" });

const defualtItems = [item1, item2, item3];
const List = mongoose.model("List", listSchema);

async function getItems(res, day, items) {
  const foundItems = await Item.find({});

  if (!foundItems.length) {
    Item.insertMany(defualtItems)
      .then(() => {
        console.log(`Inserted Successfully`);
      })
      .catch((err) => console.log(err));
  } else {
    res.render("list", { listTitle: day, newListItems: items });
  }
}

const workItem = new Work({ name: "Print Paper" });
let customListName;
// Work.insertOne(workItem);

const day = date.getDate();
app.get("/", async function (req, res) {
  const items = await Item.find({});
  getItems(res, day, items);
});

app.get("/:customListName", async function (req, res) {
  customListName = _.capitalize(req.params.customListName);

  const found = await List.findOne({ name: customListName });

  if (found) {
    getItems(res, customListName, found.items);
  } else {
    const list = new List({
      name: customListName,
      items: defualtItems,
    });
    list.save();
    res.redirect("/" + customListName);
  }
});

app.post("/", async function (req, res) {
  const item = req.body.newItem;
  console.log(req.body);
  if (req.body.list === day) {
    Item.insertOne({ name: item })

      .then(() => console.log(`Item Saved Successfully`))
      .catch((err) => console.log(err));

    res.redirect("/");
  } else {
    await List.updateOne(
      { name: customListName },
      { $push: { items: { name: item } } }
    )
      .then(() => console.log(`Item Pushed Successfully`))
      .catch((err) => console.log(err));
    res.redirect("/" + customListName);
  }
});

app.post("/delete", async function (req, res) {
  const id = req.body.checkbox;
  // console.log(await List.findById(id));

  if (await Item.findById(id)) {
    await Item.findByIdAndDelete(id)
      .then(() => console.log(`Item Deleted Successfully`))
      .catch((err) => console.log(err));
    res.redirect("/");
  } else {
    await List.updateOne(
      { name: customListName },
      { $pull: { items: { _id: id } } }
    )
      .then(() => console.log(`Item Pulled Successfully`))
      .catch((err) => console.log(err));
    res.redirect("/" + customListName);
  }
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
