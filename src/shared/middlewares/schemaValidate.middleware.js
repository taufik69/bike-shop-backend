const { HTTP_STATUS } = require("../config/constant.config");
const { ApiError } = require("../utils/apiError.utils");

const schemaValidate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);

    if (error) {
      console.log("from validate middleware", error);
      next(new ApiError(error.message, HTTP_STATUS.BAD_REQUEST));
    }

    req[property] = value;
    next();
  };
};

module.exports = schemaValidate;
