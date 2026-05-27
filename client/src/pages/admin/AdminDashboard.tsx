import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, Download, Users } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  const { data: announcements } = trpc.announcements.list.useQuery({ all: true });
  const { data: events } = trpc.events.list.useQuery({ all: true });
  const { data: resources } = trpc.resources.list.useQuery({ all: true });
  const { data: members } = trpc.org.list.useQuery();

  const stats = [
    {
      label: "公告",
      value: announcements?.length ?? 0,
      icon: Bell,
      href: "/admin/announcements",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "活動",
      value: events?.length ?? 0,
      icon: Calendar,
      href: "/admin/events",
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "資源",
      value: resources?.length ?? 0,
      icon: Download,
      href: "/admin/resources",
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "幹部",
      value: members?.length ?? 0,
      icon: Users,
      href: "/admin/organization",
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif mb-1">管理後台</h1>
          <p className="text-muted-foreground text-sm">歡迎回來，以下是系學會網站的總覽資訊。</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="border border-border shadow-none hover:shadow-md transition-all cursor-pointer card-hover">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif mb-0.5">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">最近公告</h2>
                <Link href="/admin/announcements">
                  <span className="text-xs text-primary hover:underline cursor-pointer">管理</span>
                </Link>
              </div>
              <div className="space-y-2">
                {announcements?.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="flex-1 truncate">{a.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.createdAt).toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                )) ?? <p className="text-sm text-muted-foreground">尚無公告</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">最近活動</h2>
                <Link href="/admin/events">
                  <span className="text-xs text-primary hover:underline cursor-pointer">管理</span>
                </Link>
              </div>
              <div className="space-y-2">
                {events?.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span className="flex-1 truncate">{e.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(e.startAt).toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                )) ?? <p className="text-sm text-muted-foreground">尚無活動</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
