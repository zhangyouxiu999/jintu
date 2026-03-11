import { NextResponse } from "next/server";

export class ApiResponder {
  static success<T>(
    data: T,
    message: string = "Success",
    status: number = 200
  ) {
    return NextResponse.json({ success: true, message, data }, { status });
  }

  static error(message: string, status: number = 400, error?: any) {
    return NextResponse.json({ success: false, message, error }, { status });
  }

  static unauthorized(message: string = "Unauthorized") {
    return this.error(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return this.error(message, 403);
  }

  static notFound(message: string = "Not Found") {
    return this.error(message, 404);
  }

  static serverError(message: string = "Internal Server Error", error?: any) {
    return this.error(message, 500, error);
  }
}
