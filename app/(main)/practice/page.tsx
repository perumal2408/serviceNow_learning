import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function PracticeIndexPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Practice</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sharpen your skills with hands-on coding exercises
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4 py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-semibold">Choose a lesson to practice</p>
            <p className="text-sm text-muted-foreground mt-1">
              Each lesson has an associated coding exercise. Open a lesson, then click &ldquo;Start Practice&rdquo;.
            </p>
          </div>
          <Button asChild>
            <Link href="/roadmap">
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Browse Roadmap
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
