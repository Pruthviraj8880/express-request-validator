
const test = require("node:test");
const assert = require("node:assert");

const { validateRequest } = require("../src");

function createMockResponse() {
  return {
    statusCode: 200,
    responseData: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.responseData = data;
      return this;
    }
  };
}

test("should call next for valid request data", () => {
  const middleware = validateRequest({
    body: {
      name: {
        type: "string",
        required: true,
        minLength: 3
      }
    }
  });

  const req = {
    body: { name: "Pruthviraj" }
  };

  const res = createMockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
});

test("should reject missing required fields", () => {
  const middleware = validateRequest({
    body: {
      name: {
        type: "string",
        required: true
      }
    }
  });

  const req = { body: {} };
  const res = createMockResponse();

  middleware(req, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.responseData.errors[0].field, "name");
});

test("should reject invalid email", () => {
  const middleware = validateRequest({
    body: {
      email: {
        type: "email",
        required: true
      }
    }
  });

  const req = {
    body: { email: "invalid-email" }
  };

  const res = createMockResponse();

  middleware(req, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.responseData.errors[0].field, "email");
});

test("should reject values below minimum length", () => {
  const middleware = validateRequest({
    body: {
      name: {
        type: "string",
        minLength: 3
      }
    }
  });

  const req = {
    body: { name: "AB" }
  };

  const res = createMockResponse();

  middleware(req, res, () => {});

  assert.strictEqual(res.statusCode, 400);
});

test("should validate numeric minimum and maximum", () => {
  const middleware = validateRequest({
    body: {
      age: {
        type: "number",
        min: 18,
        max: 100
      }
    }
  });

  const req = {
    body: { age: 15 }
  };

  const res = createMockResponse();

  middleware(req, res, () => {});

  assert.strictEqual(res.statusCode, 400);
});

test("should collect multiple validation errors", () => {
  const middleware = validateRequest({
    body: {
      name: { type: "string", required: true },
      email: { type: "email", required: true }
    }
  });

  const req = { body: {} };
  const res = createMockResponse();

  middleware(req, res, () => {});

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.responseData.errors.length, 2);
});


test("should reject a null validation schema", () => {
  assert.throws(
    () => validateRequest(null),
    {
      name: "TypeError",
      message: "Validation schema must be an object"
    }
  );
});

test("should reject unsupported request sections", () => {
  assert.throws(
    () => validateRequest({
      headers: {
        token: { type: "string" }
      }
    }),
    /Unsupported request section/
  );
});

test("should reject invalid field rules", () => {
  assert.throws(
    () => validateRequest({
      body: {
        name: null
      }
    }),
    /Invalid validation rules/
  );
});

test("should reject unsupported validation types", () => {
  assert.throws(
    () => validateRequest({
      body: {
        age: { type: "date" }
      }
    }),
    /Unsupported validation type/
  );
});

test("should reject minimum length greater than maximum length", () => {
  assert.throws(
    () => validateRequest({
      body: {
        name: {
          type: "string",
          minLength: 10,
          maxLength: 5
        }
      }
    }),
    /minLength cannot exceed maxLength/
  );
});



test("should validate query parameters", () => {
  const middleware = validateRequest({
    query: {
      age: {
        type: "number",
        required: true,
        min: 18
      }
    }
  });

  const req = {
    query: { age: "20" }
  };

  const res = createMockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
});

test("should validate URL route parameters", () => {
  const middleware = validateRequest({
    params: {
      id: {
        type: "number",
        required: true,
        min: 1
      }
    }
  });

  const req = {
    params: { id: "25" }
  };

  const res = createMockResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
});

