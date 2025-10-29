import { ZodError } from "zod";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const payload = {
    success: false,
    message: err.message || "Internal server error",
  };

  if (err instanceof ZodError) {
    payload.message = "Validation failed";
    payload.errors = err.errors.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    res.status(422).json(payload);
    return;
  }

  if (err.name === "ValidationError" && err.errors) {
    payload.message = "Validation failed";
    payload.errors = Object.values(err.errors).map((issue) => issue.message);
  }

  if (err.name === "CastError") {
    payload.message = "Invalid identifier supplied";
    res.status(400).json(payload);
    return;
  }

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json(payload);
};
