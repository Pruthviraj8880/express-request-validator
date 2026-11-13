
# Express Request Validator

A lightweight and reusable Express.js middleware for validating request body, query parameters, and route parameters.

## Features

- Validate request body, query, and route parameters
- Required field validation
- String, number, boolean, and email validation
- Minimum and maximum string length
- Minimum and maximum numeric values
- Custom validation error messages
- Multiple validation errors returned together
- Schema validation
- Lightweight with minimal dependencies

## Installation

```bash
npm install pruthviraj-express-request-validator
```

Express must also be installed in your project:

```bash
npm install express
```

## Usage

```javascript
const express = require("express");
const { validateRequest } = require("pruthviraj-express-request-validator");

const app = express();

app.use(express.json());

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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Supported Validation Types

| Type | Description |
|---|---|
| string | Checks whether the value is a string |
| number | Accepts finite numbers and numeric strings |
| boolean | Checks whether the value is a boolean |
| email | Checks whether the value matches the email pattern |

## Supported Rules

| Rule | Description |
|---|---|
| required | Makes a field mandatory |
| type | Defines the expected data type |
| minLength | Minimum string length |
| maxLength | Maximum string length |
| min | Minimum numeric value |
| max | Maximum numeric value |
| message | Custom error message |

## Validate Query Parameters

```javascript
app.get(
  "/search",
  validateRequest({
    query: {
      age: {
        type: "number",
        min: 18
      }
    }
  }),
  (req, res) => {
    res.json({ success: true });
  }
);
```

## Validate Route Parameters

```javascript
app.get(
  "/users/:id",
  validateRequest({
    params: {
      id: {
        type: "number",
        required: true,
        min: 1
      }
    }
  }),
  (req, res) => {
    res.json({ success: true });
  }
);
```

## Error Response

When validation fails, the middleware returns HTTP 400:

```json
{
  "success": false,
  "message": "Request validation failed",
  "errors": [
    {
      "field": "email",
      "source": "body",
      "message": "email must be a valid email"
    }
  ]
}
```

## Running Tests

```bash
npm test
```

## Requirements

- Node.js 18 or later
- Express.js 4 or later

## License

MIT

