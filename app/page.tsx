"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <div className="flex justify-center">
      <div className="flex gap-4 flex-col">
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/attendance/one")}
        >
          佰盈1班
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/attendance/two")}
        >
          佰盈2班
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/attendance/three")}
        >
          佰盈3班
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/attendance/four")}
        >
          佰盈4班
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/attendance/five")}
        >
          佰盈5班
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/attendance/six")}
        >
          佰盈6班
        </Button>
      </div>
    </div>
  );
}
