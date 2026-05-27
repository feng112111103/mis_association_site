import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Edit2, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = ["課程資料", "表單", "規章", "學習資源", "其他"];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminResources() {
  const utils = trpc.useUtils();
  const { data: resources, isLoading } = trpc.resources.list.useQuery({ all: true });
  const uploadMutation = trpc.resources.getUploadUrl.useMutation();
  const createMutation = trpc.resources.create.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); toast.success("資源已新增"); setOpen(false); },
    onError: () => toast.error("新增失敗"),
  });
  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); toast.success("資源已更新"); setOpen(false); },
    onError: () => toast.error("更新失敗"),
  });
  const deleteMutation = trpc.resources.delete.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); toast.success("資源已刪除"); },
    onError: () => toast.error("刪除失敗"),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("其他");
  const [isPublished, setIsPublished] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ResourceItem = NonNullable<typeof resources>[number];

  const openCreate = () => {
    setEditId(null);
    setTitle(""); setDescription(""); setCategory("其他"); setIsPublished(true); setSelectedFile(null);
    setOpen(true);
  };

  const openEdit = (item: ResourceItem) => {
    setEditId(item.id);
    setTitle(item.title); setDescription(item.description); setCategory(item.category); setIsPublished(item.isPublished); setSelectedFile(null);
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("檔案大小不能超過 50MB");
        return;
      }
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("請填寫標題"); return; }
    if (!editId && !selectedFile) { toast.error("請選擇檔案"); return; }

    setUploading(true);
    try {
      if (selectedFile) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]!);
        const base64 = btoa(binary);
        const { key, url } = await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          fileData: base64,
        });
        if (editId) {
          await updateMutation.mutateAsync({ id: editId, title, description, category, isPublished });
        } else {
          await createMutation.mutateAsync({
            title, description, category, isPublished,
            fileKey: key, fileUrl: url,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
          });
        }
      } else if (editId) {
        await updateMutation.mutateAsync({ id: editId, title, description, category, isPublished });
      }
    } catch (err) {
      toast.error("操作失敗，請稍後再試");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif mb-1">資源管理</h1>
            <p className="text-muted-foreground text-sm">上傳並管理課程資料、表單、規章等學習資源</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            上傳資源
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(resources ?? []).map((item) => (
              <div
                key={item.id}
                className={cn("flex items-center gap-4 p-4 rounded-xl border bg-card", !item.isPublished && "opacity-60")}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{item.category}</Badge>
                    <span className="text-xs text-muted-foreground">{item.fileName}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</span>
                    <span className="text-xs text-muted-foreground">↓ {item.downloadCount}</span>
                    {!item.isPublished && <Badge variant="secondary" className="text-xs px-1.5 py-0">草稿</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => openEdit(item)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(resources ?? []).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>尚無資源，點擊「上傳資源」開始新增</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯資源" : "上傳資源"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editId && (
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">點擊選擇檔案</p>
                    <p className="text-xs text-muted-foreground mt-1">支援所有格式，最大 50MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>標題 *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="資源標題" />
            </div>
            <div className="space-y-1.5">
              <Label>說明</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="資源說明..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>分類</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label>發布</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={uploading || createMutation.isPending || updateMutation.isPending}>
              {uploading ? "上傳中..." : editId ? "更新" : "上傳"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>確認刪除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">此操作無法復原，確定要刪除這個資源嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { if (deleteId) { deleteMutation.mutate({ id: deleteId }); setDeleteId(null); } }} disabled={deleteMutation.isPending}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
