class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends CustomError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

class ValidationError extends CustomError {
    constructor(message = "Validation error") {
        super(message, 400);
    }
}

class UnauthorizedError extends CustomError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

class ForbiddenError extends CustomError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}

module.exports = {
    CustomError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError
};

