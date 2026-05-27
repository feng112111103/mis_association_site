import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Streamdown } from "streamdown";

export default function Events() {
  const { data: events, isLoading } = trpc.events.list.useQuery();
  const now = Date.now();

  const upcoming = (events ?? []).filter((e) => new Date(e.startAt).getTime() >= now - 86400000);
  const past = (events ?? []).filter((e) => new Date(e.startAt).getTime() < now - 86400000);

  return (
    <div className="min-h-screen">
      <div className="bg-primary py-16">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-accent" />
            <span className="text-accent text-xs font-medium uppercase tracking-wider">資管系學會</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-serif mb-2">活動資訊</h1>
          <p className="text-white/60 text-sm">探索系學會精彩活動，豐富你的大學生活</p>
        </div>
      </div>

      <div className="container py-10">
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming" className="gap-2">
              即將舉行
              {upcoming.length > 0 && (
                <span className="bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">過去活動</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <EventGrid events={upcoming} isLoading={isLoading} emptyMessage="近期暫無活動" />
          </TabsContent>
          <TabsContent value="past">
            <EventGrid events={past} isLoading={isLoading} emptyMessage="尚無過去活動記錄" isPast />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EventGrid({
  events,
  isLoading,
  emptyMessage,
  isPast = false,
}: {
  events: Array<{
    id: number;
    title: string;
    description: string;
    location: string;
    startAt: Date;
    endAt: Date | null;
    imageUrl: string | null;
  }>;
  isLoading: boolean;
  emptyMessage: string;
  isPast?: boolean;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, i) => {
        const startDate = new Date(event.startAt);
        const endDate = event.endAt ? new Date(event.endAt) : null;
        const isOpen = expanded === event.id;

        return (
          <Card
            key={event.id}
            className={cn(
              "overflow-hidden border border-border shadow-none hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-in-up",
              `delay-${(i % 3 + 1) * 100}`,
              isPast && "opacity-75"
            )}
            onClick={() => setExpanded(isOpen ? null : event.id)}
          >
            <div className={cn("h-1.5", isPast ? "bg-muted" : "bg-gradient-to-r from-primary to-accent")} />
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/8 flex flex-col items-center justify-center shrink-0 border border-primary/10">
                  <span className="text-xs font-semibold text-primary/70 leading-none">
                    {startDate.toLocaleDateString("zh-TW", { month: "short" })}
                  </span>
                  <span className="text-2xl font-bold text-primary leading-none font-serif">
                    {startDate.getDate()}
                  </span>
                  <span className="text-xs text-primary/50 leading-none">
                    {startDate.toLocaleDateString("zh-TW", { weekday: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge
                      variant={isPast ? "secondary" : "default"}
                      className={cn("text-xs", !isPast && "bg-accent text-accent-foreground border-0")}
                    >
                      {isPast ? "已結束" : "即將舉行"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">{event.title}</h3>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {startDate.toLocaleString("zh-TW", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {endDate && (
                      <> — {endDate.toLocaleString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</>
                    )}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground leading-relaxed animate-fade-in">
                  <Streamdown>{event.description}</Streamdown>
                </div>
              )}

              <div className="mt-3 text-xs text-primary/60 font-medium">
                {isOpen ? "收起說明 ▲" : "查看詳情 ▼"}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
