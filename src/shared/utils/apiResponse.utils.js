class ApiResponse {
  static success(res, statusCode, message, data = null) {
    const response = {
      success: true,
      statusCode,
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  static error(res, statusCode, message, data = null) {
    const response = {
      success: false,
      statusCode,
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  static paginated(res, statusCode, message, data, page, limit, total) {
    const response = {
      success: true,
      statusCode,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
