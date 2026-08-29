import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-3 text-slate-600">The page you are looking for does not exist.</p>
        <Link href="/ar" className="mt-5 inline-block">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
}
