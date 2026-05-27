import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Download, File, FileText, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["全部", "課程資料", "表單", "規章", "學習資源", "其他"];

const MIME_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "application/vnd.ms-powerpoint": "📊",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "📊",
  "application/zip": "🗜️",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Resources() {
  const { data: resources, isLoading } = trpc.resources.list.useQuery();
  const downloadMutation = trpc.resources.download.useMutation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = (resources ?? []).filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "全部" || r.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, r) => {
    const cat = r.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(r);
    return acc;
  }, {});

  const handleDownload = async (id: number, title: string) => {
    try {
      const result = await downloadMutation.mutateAsync({ id });
      const a = document.createElement("a");
      a.href = result.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      toast.success(`開始下載：${title}`);
    } catch {
      toast.error("下載失敗，請稍後再試");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-primary py-16">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-accent" />
            <span className="text-accent text-xs font-medium uppercase tracking-wider">資管系學會</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-serif mb-2">資源下載</h1>
          <p className="text-white/60 text-sm">課程資料、表單、規章等學習資源一次取得</p>
        </div>
      </div>

      <div className="container py-10">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋資源..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">找不到符合的資源</p>
            <p className="text-sm mt-1">請嘗試其他搜尋條件</p>
          </div>
        ) : activeCategory !== "全部" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r, i) => (
              <ResourceCard key={r.id} resource={r} index={i} onDownload={handleDownload} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-semibold text-foreground">{cat}</h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{items.length} 個檔案</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((r, i) => (
                    <ResourceCard key={r.id} resource={r} index={i} onDownload={handleDownload} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceCard({
  resource,
  index,
  onDownload,
}: {
  resource: {
    id: number;
    title: string;
    description: string;
    category: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    downloadCount: number;
    createdAt: Date;
  };
  index: number;
  onDownload: (id: number, title: string) => void;
}) {
  const icon = MIME_ICONS[resource.mimeType] ?? "📁";

  return (
    <Card
      className={cn(
        "border border-border shadow-none hover:shadow-md transition-all duration-200 animate-fade-in-up",
        `delay-${(index % 3 + 1) * 100}`
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0 mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground leading-snug mb-1 line-clamp-2">
              {resource.title}
            </h3>
            {resource.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{resource.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {resource.category}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatFileSize(resource.fileSize)}</span>
              <span className="text-xs text-muted-foreground">↓ {resource.downloadCount}</span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full mt-3 gap-2 bg-primary hover:bg-primary/90"
          onClick={() => onDownload(resource.id, resource.title)}
        >
          <Download className="w-3.5 h-3.5" />
          下載
        </Button>
      </CardContent>
    </Card>
  );
}
