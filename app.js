//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Specifying our mongoose url server 

mongoose.connect("mongodb+srv://kellsonphilips:Light45617398@firstcluster0.wft7b.mongodb.net/todolistDB", {useNewUrlParser: true});

// Creating our database schema for the app todolist

const itemsSchema = {
    name: String
};

// Creating a mongoose model for our database

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your Todolist!"
});

const item2 = new Item({
    name: "Click the + sign to add a new item!"
});

const item3 = new Item ({
    name: "<-- Check box to delete an item!"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



// Home route function

app.get("/", function(req, res) {

    // Sending our items stored in the database to the home route

    Item.find({}, function(err, foundItems) {

        // if our database foundItems is empty then the defaultItems which is 3 is added.
        // The function checks if there is any error and log it in the console to be checked.
        // if there is no errors then it logs that we have successfully saved our defaultItems to our array item.
        // It redirects to the home route and render the newListItems in our browser. 

        if (foundItems.length === 0) {

            Item.insertMany(defaultItems, function(err) {
                if (err) {
                 console.log(err);
            } else {
                 console.log("Succesfully saved Items to our document in database.")
            }
        });
        res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    }); 
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  // Creating a new list if the list doesn't exist and if it does exist display the already existing list. 
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){

        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(){
            res.redirect("/" + customListName);
        });
        
      } else {

        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});



// Passing the entered new items to our to lists in the home route as well as our work route using BodyParser

app.post("/", function(req, res){

    // Posting a new item into our todo list using mongoose
    // We grab the new added item with req.body.newItem
    // Then create a mongoose item model that stores the new Item and list name and pass the itemName as well as listName which we grabbed from the body-parser
    // We save our new Item in the databse then redirect the saved new Item to our home page or home route.
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);  // Redirects to the newly created listName instead of home route
        });
    }
});

// Posting our delete route when an item is deleted from the todolist

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    // When the item to be deleted is from the home route Today listName then delete and remain in the home route

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
        if (!err) {
            console.log("Succesfully deleted the checked item.")
            res.redirect("/");
        }
    });
    } else {
        
        // If the item we want to delete is not from the home route.
        // we find the list name we want to delete from , we scan through the array of items with a mongoose $pull model
        // Find the item in the array we want to delete before deleting it from our database.
        // Then redirect to the same customListName

        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
                if (!err) {
                res.redirect("/" + listName);   // After deletion redirect to the same listName item was delted from.
            }
        });
    }
});

// About route and it's window

app.get("/about", function(req, res){
  res.render("about");
});

// localhost server listening to help run your code in the browser without the database for testing.

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
