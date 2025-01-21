const express = require("express");
const PORT = 3007;
const { Client } = require("pg");


const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "my_db",
  password: "postgres",
  port: 5432,
});


client.connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection error:", err.stack));

const app = express();
app.use(express.json());

app.get("/check", (req, res) => {
  res.status(200).json({ message: "Hello every one welcome to my project" });
});


app.get("/data", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM tables;"); 
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching items:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/post", async (req, res) => {
  try {
    const { id, name, email, age } = req.body;

    
    if (!id || !name || !email || !age) {
      return res.status(400).json({ error: "All fields (id, name, email, age) are required." });
    }

   
    const query = "INSERT INTO tables (id, name, email, age) VALUES ($1, $2, $3, $4) RETURNING *;";
    const values = [id, name, email, age];
    const result = await client.query(query, values);

    res.status(201).json({
      message: "Item added successfully",
      item: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      res.status(400).json({ error: "Duplicate entry. The ID must be unique." });
    } else if (error.code === "42703") {
      res.status(400).json({ error: "Invalid column name in the query." });
    } else {
      console.error("Error inserting item:", error.message, error.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});


app.put("/put/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID provided." });
  }

  const { age } = req.body;

  if (!age) {
    return res.status(400).json({ error: "Age is required for update." });
  }

  try {
    const result = await client.query(
      "UPDATE tables SET age = $1 WHERE id = $2 RETURNING *;",
      [age, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Item not found" });
    } else {
      res.status(200).json({ message: "Item updated successfully", item: result.rows[0] });
    }
  } catch (error) {
    console.error("Error updating item:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID provided." });
  }

  try {
    const result = await client.query("DELETE FROM tables WHERE id = $1 RETURNING *;", [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Item not found" });
    } else {
      res.status(200).json({ message: "Item deleted successfully", item: result.rows[0] });
    }
  } catch (error) {
    console.error("Error deleting item:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});