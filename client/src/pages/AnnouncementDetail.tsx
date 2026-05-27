import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bell, Calendar, Tag } from "lucide-react";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Streamdown } from "streamdown";

export default function AnnouncementDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, error } = trpc.announcements.get.useQuery({ id }, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="container py-12 max-w-3xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-20 text-center">
        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">找不到此公告</h2>
        <p className="text-muted-foreground mb-6">此公告可能已被移除或不存在</p>
        <Link href="/announcements">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回公告列表
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-primary py-12">
        <div className="container max-w-3xl">
          <Link href="/announcements">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-2 mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              返回公告列表
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-accent text-accent-foreground border-0">{data.category}</Badge>
            {data.isPinned && (
              <Badge variant="outline" className="border-white/30 text-white/80 text-xs">
                置頂
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif leading-tight">
            {data.title}
          </h1>
        </div>
      </div>

      <div className="container max-w-3xl py-10">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            發布於 {new Date(data.createdAt).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4" />
            {data.category}
          </div>
        </div>

        <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-a:text-primary">
          <Streamdown>{data.content}</Streamdown>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/announcements">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回公告列表
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
