
class ApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: any;

    constructor(
        statusCode: number = 200,
        success: boolean = true,
        message: string = "",
        data: any = null
    ) {
        this.statusCode = statusCode;
        this.success = success;
        this.message = message;
        this.data = data;
    }
}

export { ApiResponse }