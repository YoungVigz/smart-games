export interface ApiResponse<T> {
	success: boolean;
	data: T;
	timestamp: string;
}

export interface ApiErrorResponse {
	success: false;
	statusCode: number;
	message: string | object;
	timestamp: string;
	path: string;
}
