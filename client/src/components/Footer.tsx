import { BookOpen, ExternalLink, Heart, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <div className="font-bold font-serif text-base">資管系學會</div>
                <div className="text-xs text-primary-foreground/70">亞東科技大學</div>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              亞東科技大學資訊管理系學會，致力於服務系上同學，提供豐富的學術與課外活動資源。
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/aeust__mis"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:mis@aeust.edu.tw"
                className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-primary-foreground/60">
              快速連結
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/announcements", label: "最新公告" },
                { href: "/events", label: "活動資訊" },
                { href: "/organization", label: "組織介紹" },
                { href: "/resources", label: "資源下載" },
                { href: "/ai-assistant", label: "AI 問答助理" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="text-sm text-primary-foreground/70 hover:text-accent transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-primary-foreground/60">
              聯絡資訊
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                新北市板橋區四川路二段 58 號
              </li>
              <li className="flex items-center gap-2.5 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4 shrink-0 text-accent" />
                (02) 7738-8000
              </li>
              <li className="flex items-center gap-2.5 text-sm text-primary-foreground/70">
                <ExternalLink className="w-4 h-4 shrink-0 text-accent" />
                <a
                  href="https://www.aeust.edu.tw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  亞東科技大學官網
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} 亞東科技大學資訊管理系學會. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-accent" /> by 資管系學會
          </p>
        </div>
      </div>
    </footer>
  );
}
