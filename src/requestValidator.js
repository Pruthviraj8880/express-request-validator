const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUPPORTED_TYPES = ["string", "number", "boolean", "email"];
const SUPPORTED_SECTIONS = ["body", "query", "params"];

// Check whether a value is missing
function isMissing(value) {
  return value === undefined || value === null;
}

// Validate the complete schema before creating middleware
function validateSchema(schema) {
  if (
    typeof schema !== "object" ||
    schema === null ||
    Array.isArray(schema)
  ) {
    throw new TypeError("Validation schema must be an object");
  }

  for (const section of Object.keys(schema)) {
    if (!SUPPORTED_SECTIONS.includes(section)) {
      throw new TypeError(`Unsupported request section: ${section}`);
    }

    const sectionSchema = schema[section];

    if (
      typeof sectionSchema !== "object" ||
      sectionSchema === null ||
      Array.isArray(sectionSchema)
    ) {
      throw new TypeError(`Invalid validation schema for "${section}"`);
    }

    for (const [fieldName, rules] of Object.entries(sectionSchema)) {
      if (
        typeof rules !== "object" ||
        rules === null ||
        Array.isArray(rules)
      ) {
        throw new TypeError(`Invalid validation rules for "${fieldName}"`);
      }

      const type = rules.type || "string";

      if (!SUPPORTED_TYPES.includes(type)) {
        throw new TypeError(`Unsupported validation type: ${type}`);
      }

      if (
        rules.required !== undefined &&
        typeof rules.required !== "boolean"
      ) {
        throw new TypeError(`"required" for "${fieldName}" must be a boolean`);
      }

      if (rules.message !== undefined && typeof rules.message !== "string") {
        throw new TypeError(`"message" for "${fieldName}" must be a string`);
      }

      for (const rule of ["minLength", "maxLength", "min", "max"]) {
        if (rules[rule] !== undefined) {
          if (
            typeof rules[rule] !== "number" ||
            !Number.isFinite(rules[rule]) ||
            (rule.includes("Length") && rules[rule] < 0)
          ) {
            throw new TypeError(`"${rule}" for "${fieldName}" must be a valid number`);
          }
        }
      }

      if (
        rules.minLength !== undefined &&
        rules.maxLength !== undefined &&
        rules.minLength > rules.maxLength
      ) {
        throw new TypeError(`minLength cannot exceed maxLength for "${fieldName}"`);
      }

      if (
        rules.min !== undefined &&
        rules.max !== undefined &&
        rules.min > rules.max
      ) {
        throw new TypeError(`min cannot exceed max for "${fieldName}"`);
      }

      if (
        (rules.minLength !== undefined || rules.maxLength !== undefined) &&
        type !== "string"
      ) {
        throw new TypeError(`Length rules can only be used with string fields`);
      }

      if (
        (rules.min !== undefined || rules.max !== undefined) &&
        type !== "number"
      ) {
        throw new TypeError(`min and max can only be used with number fields`);
      }
    }
  }
}

// Check whether a value is missing
function validateField(fieldName, value, rules, source) {
  const errors = [];
  const required = rules.required === true;

  if (isMissing(value) || (required && value === "")) {
    if (required) {
      errors.push({
        field: fieldName,
        source,
        message: rules.message || `${fieldName} is required`
      });
    }

    return errors;
  }

  const type = rules.type || "string";
  let isValidType = true;

  switch (type) {
    case "string":
      isValidType = typeof value === "string";
      break;

    case "number":
      isValidType =
        typeof value === "number"
          ? Number.isFinite(value)
          : typeof value === "string" &&
            value.trim() !== "" &&
            Number.isFinite(Number(value));
      break;

    case "boolean":
      isValidType = typeof value === "boolean";
      break;

    case "email":
      isValidType =
        typeof value === "string" &&
        EMAIL_REGEX.test(value);
      break;
  }

  if (!isValidType) {
    errors.push({
      field: fieldName,
      source,
      message: rules.message || `${fieldName} must be a valid ${type}`
    });

    return errors;
  }

  // Validate string length
  if (type === "string") {
    if (
      rules.minLength !== undefined &&
      value.length < rules.minLength
    ) {
      errors.push({
        field: fieldName,
        source,
        message: rules.message ||
          `${fieldName} must be at least ${rules.minLength} characters long`
      });
    }

    if (
      rules.maxLength !== undefined &&
      value.length > rules.maxLength
    ) {
      errors.push({
        field: fieldName,
        source,
        message: rules.message ||
          `${fieldName} must not exceed ${rules.maxLength} characters`
      });
    }
  }

  // Validate numeric range
  if (type === "number") {
    const numericValue = Number(value);

    if (
      rules.min !== undefined &&
      numericValue < rules.min
    ) {
      errors.push({
        field: fieldName,
        source,
        message: rules.message ||
          `${fieldName} must be at least ${rules.min}`
      });
    }

    if (
      rules.max !== undefined &&
      numericValue > rules.max
    ) {
      errors.push({
        field: fieldName,
        source,
        message: rules.message ||
          `${fieldName} must not exceed ${rules.max}`
      });
    }
  }

  return errors;
}

// Validate all fields in one request section
function validateSection(data, schema, source) {
  const errors = [];

  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName];

    const fieldErrors = validateField(
      fieldName,
      value,
      rules,
      source
    );

    errors.push(...fieldErrors);
  }

  return errors;
}

// Express request validation middleware
function validateRequest(schema = {}) {
  validateSchema(schema);

  return (req, res, next) => {
    const errors = [];

    for (const section of SUPPORTED_SECTIONS) {
      if (schema[section] === undefined) {
        continue;
      }

      const requestData = req[section] || {};

      const sectionErrors = validateSection(
        requestData,
        schema[section],
        section
      );

      errors.push(...sectionErrors);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed",
        errors
      });
    }

    next();
  };
}

module.exports = validateRequest;
