import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  Download,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-primary">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                            radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[oklch(0.18_0.07_260)]" />

      {/* Gold accent shapes */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/8 blur-2xl" />

      <div className="container relative z-10 py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6 animate-fade-in">
            <div className="h-px w-8 bg-accent" />
            <span className="text-accent text-sm font-medium tracking-wider uppercase">
              亞東科技大學
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-serif leading-tight mb-6 animate-fade-in-up">
            資訊管理系
            <br />
            <span className="text-accent">學生會</span>
          </h1>

          <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl animate-fade-in-up delay-100">
            凝聚資管人的力量，提供最新公告、精彩活動與豐富學習資源，
            更有 AI 助理隨時解答你的疑問。
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in-up delay-200">
            <Link href="/announcements">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold">
                查看最新公告
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ai-assistant">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-2 bg-transparent"
              >
                <Bot className="w-4 h-4" />
                詢問 AI 助理
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-14 animate-fade-in-up delay-300">
            {[
              { label: "活躍幹部", value: "20+" },
              { label: "年度活動", value: "15+" },
              { label: "學習資源", value: "50+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-accent font-serif">{stat.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 80L48 69.3C96 58.7 192 37.3 288 32C384 26.7 480 37.3 576 42.7C672 48 768 48 864 42.7C960 37.3 1056 26.7 1152 26.7C1248 26.7 1344 37.3 1392 42.7L1440 48V80H0Z"
            fill="oklch(0.98 0.005 85)"
          />
        </svg>
      </div>
    </section>
  );
}

function AnnouncementsSection() {
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery();
  const recent = announcements?.slice(0, 4) ?? [];

  return (
    <section className="py-20">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="gold-line mb-3" />
            <h2 className="section-heading text-3xl">最新公告</h2>
          </div>
          <Link href="/announcements">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>目前暫無公告</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((item, i) => (
              <Link key={item.id} href={`/announcements/${item.id}`}>
                <div
                  className={cn(
                    "group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer animate-fade-in-up",
                    `delay-${(i + 1) * 100}`
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.isPinned && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-accent/15 text-accent-foreground border-0">
                          置頂
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("zh-TW")}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EventsSection() {
  const { data: events, isLoading } = trpc.events.list.useQuery();
  const now = Date.now();
  const upcoming = events
    ?.filter((e) => new Date(e.startAt).getTime() >= now - 86400000)
    .slice(0, 3) ?? [];

  return (
    <section className="py-20 bg-muted/40">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="gold-line mb-3" />
            <h2 className="section-heading text-3xl">近期活動</h2>
          </div>
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>近期暫無活動</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcoming.map((event, i) => {
              const startDate = new Date(event.startAt);
              const isPast = startDate.getTime() < now;
              return (
                <Link key={event.id} href={`/events`}>
                  <Card
                    className={cn(
                      "card-hover cursor-pointer overflow-hidden border-0 shadow-sm animate-fade-in-up",
                      `delay-${(i + 1) * 100}`
                    )}
                  >
                    <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/8 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary leading-none">
                            {startDate.toLocaleDateString("zh-TW", { month: "short" })}
                          </span>
                          <span className="text-lg font-bold text-primary leading-none">
                            {startDate.getDate()}
                          </span>
                        </div>
                        <Badge
                          variant={isPast ? "secondary" : "default"}
                          className={cn(
                            "text-xs",
                            !isPast && "bg-accent text-accent-foreground border-0"
                          )}
                        >
                          {isPast ? "已結束" : "即將舉行"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-snug">
                        {event.title}
                      </h3>
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Bell,
      title: "即時公告",
      desc: "第一時間掌握系學會最新消息、重要通知與活動資訊。",
      href: "/announcements",
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: Calendar,
      title: "活動資訊",
      desc: "豐富多元的系學會活動，包含學術講座、社交聚會與競賽資訊。",
      href: "/events",
      color: "text-purple-600 bg-purple-50",
    },
    {
      icon: Users,
      title: "組織介紹",
      desc: "認識系學會各部門幹部，了解每個部門的職責與聯絡方式。",
      href: "/organization",
      color: "text-green-600 bg-green-50",
    },
    {
      icon: Download,
      title: "資源下載",
      desc: "提供課程資料、表單、規章等學習資源，方便同學隨時取用。",
      href: "/resources",
      color: "text-orange-600 bg-orange-50",
    },
    {
      icon: Bot,
      title: "AI 問答助理",
      desc: "智慧 AI 助理隨時解答你對系學會的疑問，快速找到所需資訊。",
      href: "/ai-assistant",
      color: "text-accent bg-accent/10",
    },
    {
      icon: Sparkles,
      title: "專屬服務",
      desc: "系學會致力於提升同學的學習體驗，歡迎提供意見與建議。",
      href: "/",
      color: "text-primary bg-primary/8",
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-3">
            <div className="gold-line" />
          </div>
          <h2 className="section-heading text-3xl mb-3">我們提供的服務</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            資管系學會整合多項服務，讓每位同學都能輕鬆取得所需資訊與資源。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Link key={f.title} href={f.href}>
              <Card
                className={cn(
                  "card-hover cursor-pointer border border-border shadow-none hover:shadow-md transition-all duration-200 animate-fade-in-up",
                  `delay-${(i + 1) * 100}`
                )}
              >
                <CardContent className="p-6">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", f.color)}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AICalloutSection() {
  return (
    <section className="py-20 bg-primary">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-accent" />
          </div>
          <h2 className="section-heading text-3xl text-white mb-4">
            有問題嗎？問 AI 助理！
          </h2>
          <p className="text-white/70 leading-relaxed mb-8">
            資管小幫手是專為資管系同學設計的 AI 助理，能根據系學會的最新公告、活動與資源，
            即時回答你的各種問題。
          </p>
          <Link href="/ai-assistant">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold">
              <Sparkles className="w-4 h-4" />
              立即體驗 AI 助理
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <AnnouncementsSection />
      <EventsSection />
      <FeaturesSection />
      <AICalloutSection />
    </div>
  );
}
