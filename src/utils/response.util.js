/**
 * Standardised API response helpers.
 */

function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
}

function created(res, data = null, message = 'Created successfully') {
  return success(res, data, message, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const body = { success: false, statusCode, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

function paginated(res, { data, total, page, limit }, message = 'Success') {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { success, created, noContent, error, paginated };
