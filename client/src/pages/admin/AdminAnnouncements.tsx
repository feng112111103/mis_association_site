import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Edit2, Pin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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

const CATEGORIES = ["一般", "學術", "活動", "重要", "其他"];

interface FormState {
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
}

const defaultForm: FormState = {
  title: "",
  content: "",
  category: "一般",
  isPinned: false,
  isPublished: true,
};

export default function AdminAnnouncements() {
  const utils = trpc.useUtils();
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery({ all: true });
  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => { utils.announcements.list.invalidate(); toast.success("公告已新增"); setOpen(false); },
    onError: () => toast.error("新增失敗"),
  });
  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => { utils.announcements.list.invalidate(); toast.success("公告已更新"); setOpen(false); },
    onError: () => toast.error("更新失敗"),
  });
  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => { utils.announcements.list.invalidate(); toast.success("公告已刪除"); },
    onError: () => toast.error("刪除失敗"),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  type AnnouncementItem = NonNullable<typeof announcements>[number];
  const openEdit = (item: AnnouncementItem) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      isPinned: item.isPinned,
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("請填寫標題與內容");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
    setDeleteId(null);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif mb-1">公告管理</h1>
            <p className="text-muted-foreground text-sm">新增、編輯或刪除系學會公告</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            新增公告
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(announcements ?? []).map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border bg-card",
                  !item.isPublished && "opacity-60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.isPinned && <Pin className="w-3.5 h-3.5 text-accent" />}
                    <span className="font-medium text-sm truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{item.category}</Badge>
                    {!item.isPublished && <Badge variant="secondary" className="text-xs px-1.5 py-0">草稿</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => openEdit(item)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(announcements ?? []).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>尚無公告，點擊「新增公告」開始建立</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯公告" : "新增公告"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>標題 *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="公告標題"
              />
            </div>
            <div className="space-y-1.5">
              <Label>內容 * (支援 Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="公告內容..."
                rows={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label>分類</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPinned}
                  onCheckedChange={(v) => setForm({ ...form, isPinned: v })}
                />
                <Label>置頂</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
                />
                <Label>發布</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "儲存中..." : editId ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">此操作無法復原，確定要刪除這則公告嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteMutation.isPending}
            >
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
