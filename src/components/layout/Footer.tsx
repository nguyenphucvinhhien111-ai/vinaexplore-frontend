import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <footer className="bg-surface text-on-surface border-t border-surface-container mt-auto relative">
      <div className="absolute -top-8 right-4 md:right-8 flex justify-end z-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-surface border border-b-0 border-surface-container rounded-t-lg px-4 py-1.5 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Toggle Footer"
        >
          {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-container-max mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Link
                to="/"
                className="text-2xl font-black tracking-tight text-primary"
              >
                VinaExplore
              </Link>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Khám phá vẻ đẹp bất tận của Việt Nam cùng VinaExplore. Cùng nhau
                khám phá những trải nghiệm du lịch độc đáo và đáng nhớ nhất.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2 text-primary">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary shrink-0" />
                  <span>123 Đường Du Lịch, Quận 1, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-primary shrink-0" />
                  <span>+84 (123) 456 789</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-primary shrink-0" />
                  <span>contact@vinaexplore.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-surface-container mt-3 pt-1 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-outline uppercase tracking-widest">
            <p>© {currentYear} VinaExplore. Crafted for the modern explorer.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
