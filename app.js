const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const utils = require(__dirname + "/utils");
const app = express();
const PORT = process.env.PORT || 3000;
const urlEncodedParser = bodyParser.urlencoded({ extended: true });

app.use(urlEncodedParser);
app.use(express.static("public"));

app.set("view engine", "ejs");

main().catch((err) => console.log(err));

async function main() {
	await mongoose.connect(
		"mongodb+srv://admin-mohamed:Medo132456@cluster0.eskjfxx.mongodb.net/todolistDB"
	);
	// use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
	const itemSchema = new mongoose.Schema({
		name: String,
	});
	const Item = mongoose.model("Item", itemSchema);
	const listSchema = new mongoose.Schema({
		name: String,
		list: [itemSchema],
	});
	const List = mongoose.model("List", listSchema);

	const todoItem1 = new Item({
		name: "Buy Food",
	});
	const todoItem2 = new Item({
		name: "Cook Food",
	});
	const todoItem3 = new Item({
		name: "Eat Food",
	});
	const defaultItems = [todoItem1, todoItem2, todoItem3];

	app.get("/", async (req, res) => {
		try {
			const todoDocs = await Item.find();
			if (!todoDocs.length) {
				try {
					await Item.insertMany(defaultItems);
					// We redirect to the root route again to rerender the list template after
					// inserting the initial items to DB
					return res.redirect("/");
				} catch (err) {
					console.log(err);
				}
			}
			const todoItems = todoDocs;
			res.render("list", { listTitle: "Today", todoItems: todoItems });
		} catch (err) {
			console.log(err);
		}
	});
	app.post("/", async (req, res) => {
		const todoName = req.body.newItem;
		const listName = req.body.list;

		const newTodoDoc = new Item({
			name: todoName,
		});
		if (listName === "Today") {
			try {
				await newTodoDoc.save();
				return res.redirect("/");
			} catch (err) {
				console.log(err);
			}
		} else {
			try {
				const list = await List.findOne({ name: listName });
				list.list.push(newTodoDoc);
				try {
					await list.save();
					return res.redirect("/" + listName);
				} catch (err) {
					console.log(err);
				}
			} catch (err) {
				console.log(err);
			}
		}
	});
	app.post("/delete", async (req, res) => {
		const checkedItemId = req.body.checkbox;
		const listName = req.body.listName;

		if (listName === "Today") {
			try {
				await Item.findByIdAndRemove(checkedItemId);
				return res.redirect("/");
			} catch (err) {
				console.log(err);
			}
		} else {
			try {
				await List.findOneAndUpdate(
					{ name: listName },
					{
						$pull: {
							list: {
								_id: checkedItemId,
							},
						},
					}
				);
				return res.redirect("/" + listName);
			} catch (err) {
				console.log(err);
			}
		}
	});
	app.get("/:customListName", async (req, res) => {
		const customListName = utils.capitalize(req.params.customListName);
		try {
			const listExist = await List.findOne({ name: customListName });
			if (!listExist) {
				const list = new List({
					name: customListName,
					list: defaultItems,
				});
				try {
					await list.save();
					return res.redirect("/" + customListName);
				} catch (err) {
					console.log(err);
				}
			}
			const listTitle = listExist.name;
			const todoItems = listExist.list;
			res.render("list", { listTitle: listTitle, todoItems: todoItems });
		} catch (err) {
			console.log(err);
		}
	});
}

app.listen(PORT, () => {
	console.log("Server is running on port " + PORT);
});
