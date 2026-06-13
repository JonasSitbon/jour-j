import {
  LayoutGrid, Users, Wallet, FileText, CreditCard, Calendar, Check, CheckCircle2,
  Settings, Plus, Search, Filter, Bell, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  X, Menu, Sun, Moon, Pencil, Trash2, Download, Upload, Mail, Phone, Clock, AlertTriangle,
  Info, Map, MapPin, Star, GripVertical, MoreHorizontal, Table, Gem, Cake, Camera, Music,
  Flower2, Car, Sparkles, List, Eye, LogOut, PieChart, BarChart3, Cloud, CloudRain, Droplet,
  Heart, Home, Link, Receipt, Flag, User, Baby, BedDouble, Leaf, Gift, Copy, Save, Key,
  RotateCw, Thermometer, Play, Pause,
  Activity, Server, Database, Zap,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  grid: LayoutGrid, users: Users, wallet: Wallet, file: FileText, card: CreditCard,
  calendar: Calendar, check: Check, "check-circle": CheckCircle2, settings: Settings,
  plus: Plus, search: Search, filter: Filter, bell: Bell, chevronR: ChevronRight,
  chevronL: ChevronLeft, chevronD: ChevronDown, chevronU: ChevronUp, x: X, menu: Menu,
  sun: Sun, moon: Moon, edit: Pencil, trash: Trash2, download: Download, upload: Upload,
  mail: Mail, phone: Phone, clock: Clock, alert: AlertTriangle, info: Info, map: Map,
  pin: MapPin, star: Star, drag: GripVertical, dots: MoreHorizontal, table: Table, rings: Gem,
  cake: Cake, camera: Camera, music: Music, flower: Flower2, car: Car, sparkle: Sparkles,
  list: List, eye: Eye, logout: LogOut, pie: PieChart, bars: BarChart3, cloud: Cloud,
  rain: CloudRain, droplet: Droplet, heart: Heart, home: Home, link: Link, receipt: Receipt,
  flag: Flag, user: User, baby: Baby, bed: BedDouble, leaf: Leaf, gift: Gift, copy: Copy,
  save: Save, key: Key, refresh: RotateCw, temp: Thermometer, play: Play, pause: Pause,
  activity: Activity, server: Server, database: Database, zap: Zap,
};

export function Icon({ name, size = 20, className, strokeWidth = 1.7, style }: { name: string; size?: number; className?: string; strokeWidth?: number; style?: React.CSSProperties }) {
  const C = MAP[name] || Sparkles;
  return <C size={size} className={className} strokeWidth={strokeWidth} style={style} aria-hidden />;
}

/** Logo : deux anneaux entrelacés + solitaire doré */
export function Logo({ size = 34 }: { size?: number }) {
  // viewBox carré et centré sur le contenu (centre ≈ 22,22) pour que les
  // bagues restent centrées quelle que soit la taille — évite le décalage
  // quand la sidebar est repliée.
  return (
    <svg width={size} height={size} viewBox="0 -1.75 44 44" fill="none" aria-label="Jour J">
      <circle cx={16} cy={25} r={10.5} fill="none" stroke="var(--primary)" strokeWidth={2.4} />
      <circle cx={28} cy={25} r={10.5} fill="none" stroke="var(--gold)" strokeWidth={2.4} />
      <path d="M16 5 l3.4 3.6 -3.4 4.2 -3.4 -4.2 z" fill="var(--gold)" stroke="var(--surface)" strokeWidth={1} strokeLinejoin="round" />
      <path d="M12.6 8.6 h6.8" stroke="var(--surface)" strokeWidth={0.8} />
    </svg>
  );
}
