const { env } = require("../config/env.config");

// this error show when you are working on production mode error size are more consize
const productionError = (error, res) => {
  console.log("from production error funtion ", error);
  if (error.isOperational) {
    // return res.status(error.statusCode).json({
    //   statusCode: error.statusCode,
    //   message: error.message,
    // });
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      status: error.status,
      isOperational: error.isOperationalError,
      data: error.data,
      errorStack: error.stack,
    });
  } else {
    // return res.status(error.statusCode).json({
    //   status: "error",
    //   message: "Something went wrong , please try agin later !!",
    // });
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      status: error.status,
      isOperational: error.isOperationalError,
      data: error.data,
      errorStack: error.stack,
    });
  }
};
// this error only show when you are working on developement mode
const developementError = (error, res) => {
  console.log("Error from development Error Handler", error);
  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    message: error.message,
    status: error.status,
    isOperational: error.isOperationalError,
    data: error.data,
    errorStack: error.stack,
  });
};

const globalErrorHandeler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  if (env.NODE_ENV == "developement") {
    developementError(error, res);
  } else {
    productionError(error, res);
  }
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { globalErrorHandeler, notFound };
