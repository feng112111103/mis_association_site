import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Calendar, Edit2, MapPin, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FormState {
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  isPublished: boolean;
}

const defaultForm: FormState = {
  title: "",
  description: "",
  location: "",
  startAt: "",
  endAt: "",
  isPublished: true,
};

function toDatetimeLocal(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEvents() {
  const utils = trpc.useUtils();
  const { data: events, isLoading } = trpc.events.list.useQuery({ all: true });
  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); toast.success("活動已新增"); setOpen(false); },
    onError: () => toast.error("新增失敗"),
  });
  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); toast.success("活動已更新"); setOpen(false); },
    onError: () => toast.error("更新失敗"),
  });
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); toast.success("活動已刪除"); },
    onError: () => toast.error("刪除失敗"),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  type EventItem = NonNullable<typeof events>[number];

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (item: EventItem) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      location: item.location,
      startAt: toDatetimeLocal(item.startAt),
      endAt: toDatetimeLocal(item.endAt),
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.startAt) {
      toast.error("請填寫標題與開始時間");
      return;
    }
    const startAt = new Date(form.startAt).getTime();
    const endAt = form.endAt ? new Date(form.endAt).getTime() : undefined;
    if (editId) {
      updateMutation.mutate({ id: editId, title: form.title, description: form.description, location: form.location, startAt, endAt, isPublished: form.isPublished });
    } else {
      createMutation.mutate({ title: form.title, description: form.description, location: form.location, startAt, endAt, isPublished: form.isPublished });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const now = Date.now();

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif mb-1">活動管理</h1>
            <p className="text-muted-foreground text-sm">新增、編輯或刪除系學會活動</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            新增活動
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
            {(events ?? []).map((item) => {
              const startDate = new Date(item.startAt);
              const isPast = startDate.getTime() < now;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border bg-card",
                    !item.isPublished && "opacity-60"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/8 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs text-primary/70 leading-none">
                      {startDate.toLocaleDateString("zh-TW", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold text-primary leading-none font-serif">
                      {startDate.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      <Badge
                        variant={isPast ? "secondary" : "default"}
                        className={cn("text-xs shrink-0", !isPast && "bg-accent text-accent-foreground border-0")}
                      >
                        {isPast ? "已結束" : "即將舉行"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {startDate.toLocaleString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      )}
                      {!item.isPublished && <Badge variant="secondary" className="text-xs px-1.5 py-0">草稿</Badge>}
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
              );
            })}
            {(events ?? []).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>尚無活動，點擊「新增活動」開始建立</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯活動" : "新增活動"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>活動名稱 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="活動名稱" />
            </div>
            <div className="space-y-1.5">
              <Label>說明 (支援 Markdown)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="活動說明..." rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label>地點</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="活動地點" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>開始時間 *</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>結束時間</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
              <Label>發布</Label>
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

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>確認刪除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">此操作無法復原，確定要刪除這個活動嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId }) && setDeleteId(null)} disabled={deleteMutation.isPending}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
