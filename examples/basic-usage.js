
const express = require("express");
const { validateRequest } = require("../src");

const app = express();

app.use(express.json());

// User registration endpoint
app.post(
  "/users",
  validateRequest({
    body: {
      name: {
        type: "string",
        required: true,
        minLength: 3
      },
      email: {
        type: "email",
        required: true
      },
      age: {
        type: "number",
        required: true,
        min: 18,
        max: 100
      }
    }
  }),
  (req, res) => {
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: req.body
    });
  }
);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
