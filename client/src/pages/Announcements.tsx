import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Bell, ChevronRight, Pin, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["全部", "一般", "學術", "活動", "重要", "其他"];

export default function Announcements() {
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = (announcements ?? []).filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "全部" || a.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const pinned = filtered.filter((a) => a.isPinned);
  const normal = filtered.filter((a) => !a.isPinned);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-primary py-16">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-accent" />
            <span className="text-accent text-xs font-medium uppercase tracking-wider">資管系學會</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-serif mb-2">最新公告</h1>
          <p className="text-white/60 text-sm">掌握系學會最新消息與重要通知</p>
        </div>
      </div>

      <div className="container py-10">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋公告..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">找不到符合的公告</p>
            <p className="text-sm mt-1">請嘗試其他搜尋條件</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">置頂公告</span>
                </div>
                <div className="space-y-2">
                  {pinned.map((item) => (
                    <AnnouncementRow key={item.id} item={item} pinned />
                  ))}
                </div>
              </div>
            )}

            {/* Normal */}
            {normal.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">一般公告</span>
                  </div>
                )}
                <div className="space-y-2">
                  {normal.map((item) => (
                    <AnnouncementRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementRow({
  item,
  pinned = false,
}: {
  item: { id: number; title: string; category: string; isPinned: boolean; createdAt: Date; content: string };
  pinned?: boolean;
}) {
  return (
    <Link href={`/announcements/${item.id}`}>
      <div
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer",
          pinned ? "border-accent/30 bg-accent/3" : "border-border"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            pinned ? "bg-accent/15" : "bg-primary/8"
          )}
        >
          {pinned ? (
            <Pin className="w-4 h-4 text-accent" />
          ) : (
            <Bell className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {item.category}
            </Badge>
          </div>
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.content}</p>
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          {new Date(item.createdAt).toLocaleDateString("zh-TW")}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </Link>
  );
}
