import { connectDB } from "@/libs/mongo";
import { NextResponse } from "next/server";

type Handler<T extends Record<string, string> = Record<string, string>> = (
  req: Request,
  context: { params: Promise<T> }
) => Promise<NextResponse>;

export function withDB<
  T extends Record<string, string> = Record<string, string>
>(handler: Handler<T>): Handler<T> {
  return async (req, context) => {
    try {
      await connectDB();

      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Lỗi máy chủ",
        },
        { status: 500 }
      );
    }
  };
}
