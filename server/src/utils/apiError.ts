
export class ApiError extends Error {
    statusCode: number;
    message: string;
    error: any[];
    success: boolean;

    constructor(
        statusCode: number,
        message: string = "",
        error: any[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.message = message;
        this.error = error;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}