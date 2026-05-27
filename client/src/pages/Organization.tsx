import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Mail, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DEPT_ORDER = ["會長室", "學術部", "活動部", "公關部", "資訊部", "財務部", "其他"];

const DEPT_COLORS: Record<string, string> = {
  會長室: "bg-primary text-primary-foreground",
  學術部: "bg-blue-600 text-white",
  活動部: "bg-purple-600 text-white",
  公關部: "bg-pink-600 text-white",
  資訊部: "bg-teal-600 text-white",
  財務部: "bg-amber-600 text-white",
  其他: "bg-gray-500 text-white",
};

export default function Organization() {
  const { data: members, isLoading } = trpc.org.list.useQuery();

  const grouped = (members ?? []).reduce<Record<string, typeof members>>((acc, m) => {
    const dept = m.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept]!.push(m);
    return acc;
  }, {});

  const deptKeys = [
    ...DEPT_ORDER.filter((d) => grouped[d]),
    ...Object.keys(grouped).filter((d) => !DEPT_ORDER.includes(d)),
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-primary py-16">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-accent" />
            <span className="text-accent text-xs font-medium uppercase tracking-wider">資管系學會</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-serif mb-2">組織介紹</h1>
          <p className="text-white/60 text-sm">認識系學會各部門幹部與職責</p>
        </div>
      </div>

      <div className="container py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : members?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">幹部名單尚未公布</p>
            <p className="text-sm mt-1">請稍後再查看</p>
          </div>
        ) : (
          <div className="space-y-12">
            {deptKeys.map((dept) => (
              <div key={dept}>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-semibold",
                      DEPT_COLORS[dept] ?? "bg-gray-500 text-white"
                    )}
                  >
                    {dept}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {grouped[dept]?.map((member, i) => (
                    <MemberCard key={member.id} member={member} dept={dept} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dept Responsibilities */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <div className="gold-line mx-auto mb-3" />
            <h2 className="section-heading text-2xl">各部門職責</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { dept: "會長室", desc: "統籌系學會整體運作，負責對外代表與重大決策。", icon: "👑" },
              { dept: "學術部", desc: "規劃學術活動、讀書會、課程輔導與學習資源整理。", icon: "📚" },
              { dept: "活動部", desc: "策劃與執行各類系學會活動，包含迎新、尾牙等。", icon: "🎉" },
              { dept: "公關部", desc: "負責對外聯繫、社群媒體經營與形象宣傳。", icon: "📣" },
              { dept: "資訊部", desc: "維護系學會網站、資訊系統與技術支援。", icon: "💻" },
              { dept: "財務部", desc: "管理系學會財務收支、預算規劃與報帳作業。", icon: "💰" },
            ].map((item) => (
              <Card key={item.dept} className="border border-border shadow-none">
                <CardContent className="p-5">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold mb-2 text-foreground">{item.dept}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  dept,
  index,
}: {
  member: { id: number; name: string; title: string; department: string; email: string; description: string; avatarUrl: string | null };
  dept: string;
  index: number;
}) {
  const colorClass = DEPT_COLORS[dept] ?? "bg-gray-500 text-white";
  const initial = member.name.charAt(0);

  return (
    <Card
      className={cn(
        "border border-border shadow-none hover:shadow-md transition-all duration-200 overflow-hidden animate-fade-in-up",
        `delay-${(index % 5 + 1) * 100}`
      )}
    >
      <CardContent className="p-4 text-center">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold font-serif",
            colorClass
          )}
        >
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="text-xs text-muted-foreground mb-0.5">{member.title}</div>
        <div className="font-semibold text-sm text-foreground">{member.name}</div>
        {member.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {member.description}
          </p>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex items-center justify-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            <Mail className="w-3 h-3" />
            聯絡
          </a>
        )}
      </CardContent>
    </Card>
  );
}
