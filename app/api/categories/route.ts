import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import Category from "@/models/Category";

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    logger.error({ err: error }, "Fetch Categories Error");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
