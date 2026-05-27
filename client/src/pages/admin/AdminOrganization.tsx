import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";

const DEPARTMENTS = ["會長室", "學術部", "活動部", "公關部", "資訊部", "財務部", "其他"];

interface FormState {
  name: string;
  title: string;
  department: string;
  email: string;
  description: string;
  sortOrder: string;
}

const defaultForm: FormState = {
  name: "",
  title: "",
  department: "學術部",
  email: "",
  description: "",
  sortOrder: "0",
};

export default function AdminOrganization() {
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.org.list.useQuery();
  const createMutation = trpc.org.create.useMutation({
    onSuccess: () => { utils.org.list.invalidate(); toast.success("幹部已新增"); setOpen(false); },
    onError: () => toast.error("新增失敗"),
  });
  const updateMutation = trpc.org.update.useMutation({
    onSuccess: () => { utils.org.list.invalidate(); toast.success("幹部已更新"); setOpen(false); },
    onError: () => toast.error("更新失敗"),
  });
  const deleteMutation = trpc.org.delete.useMutation({
    onSuccess: () => { utils.org.list.invalidate(); toast.success("幹部已刪除"); },
    onError: () => toast.error("刪除失敗"),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  type MemberItem = NonNullable<typeof members>[number];

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (item: MemberItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      title: item.title,
      department: item.department,
      email: item.email,
      description: item.description,
      sortOrder: String(item.sortOrder),
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.title.trim() || !form.department.trim()) {
      toast.error("請填寫姓名、職稱與部門");
      return;
    }
    const data = {
      name: form.name,
      title: form.title,
      department: form.department,
      email: form.email,
      description: form.description,
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Group by department
  const grouped = (members ?? []).reduce<Record<string, MemberItem[]>>((acc, m) => {
    if (!acc[m.department]) acc[m.department] = [];
    acc[m.department]!.push(m);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif mb-1">組織管理</h1>
            <p className="text-muted-foreground text-sm">管理系學會幹部名單與各部門資訊</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            新增幹部
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (members ?? []).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>尚無幹部資料，點擊「新增幹部」開始建立</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dept, deptMembers]) => (
              <div key={dept}>
                <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">{dept}</h2>
                <div className="space-y-2">
                  {deptMembers.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.title}</span>
                        </div>
                        {item.email && (
                          <div className="text-xs text-muted-foreground">{item.email}</div>
                        )}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯幹部" : "新增幹部"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>姓名 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="姓名" />
              </div>
              <div className="space-y-1.5">
                <Label>職稱 *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例：部長" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>部門 *</Label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>自我介紹</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="簡短介紹..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>排序（數字越小越前面）</Label>
              <Input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} type="number" placeholder="0" />
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
          <p className="text-sm text-muted-foreground">此操作無法復原，確定要刪除這位幹部嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { if (deleteId) { deleteMutation.mutate({ id: deleteId }); setDeleteId(null); } }} disabled={deleteMutation.isPending}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
