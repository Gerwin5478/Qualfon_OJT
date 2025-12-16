import { 
  FileText, BookOpen, ShieldCheck, Tag, Truck, DoorClosed, 
  ClipboardCheck, Trash2, Wrench, Home, Brush, Settings, 
  ShieldAlert, Info, AlertCircle, AlertTriangle, Check, 
  ChevronRight, ChevronDown, Download, Search, Menu, User, 
  LogOut, LogIn, Plus, Edit2, X, Save, Upload, Image, Link, 
  LayoutDashboard, Database, FolderOpen, FileSpreadsheet,
  Loader2, GripVertical, ToggleLeft, ToggleRight, ArrowRight,
  Sparkles, MinusCircle, Send, MessageSquare,
  // New Icons
  ClipboardList, HardHat, Hammer, Construction, Lightbulb, Bell, 
  Calendar, Clock, Map, Navigation, Compass, Flag, Globe, Server, 
  Wifi, Battery, Zap, Thermometer, Droplet, Wind, Sun, Moon, 
  Cloud, Umbrella, Coffee, Utensils, Briefcase, Package, Box, 
  Archive, Layers, Layout, Grid, List, Table, Columns, Maximize, 
  Minimize, Power, RefreshCw, RotateCcw, Scissors, Paperclip, 
  Printer, Monitor, Smartphone, Tablet, Speaker, Mic, Video, 
  Camera, Eye, EyeOff, Lock, Unlock, Key, Radio, Siren, 
  FireExtinguisher, Stethoscope, Activity, CreditCard, DollarSign,
  Landmark, Users, UserPlus, UserCheck, UserX, Mail, Phone,
  MapPin, Gift, Award, ThumbsUp, HelpCircle
} from 'lucide-react';

export const iconMap: Record<string, any> = {
  FileText, BookOpen, ShieldCheck, Tag, Truck, DoorClosed, 
  ClipboardCheck, Trash2, Wrench, Home, Brush, Settings, 
  ShieldAlert, Info, AlertCircle, AlertTriangle, Check, 
  ChevronRight, ChevronDown, Download, Search, Menu, User, 
  LogOut, LogIn, Plus, Edit2, X, Save, Upload, Image, Link,
  LayoutDashboard, Database, FolderOpen, FileSpreadsheet,
  Loader2, GripVertical, ToggleLeft, ToggleRight, ArrowRight,
  Sparkles, MinusCircle, Send, MessageSquare,
  // New Icons Mapped
  ClipboardList, HardHat, Hammer, Construction, Lightbulb, Bell, 
  Calendar, Clock, Map, Navigation, Compass, Flag, Globe, Server, 
  Wifi, Battery, Zap, Thermometer, Droplet, Wind, Sun, Moon, 
  Cloud, Umbrella, Coffee, Utensils, Briefcase, Package, Box, 
  Archive, Layers, Layout, Grid, List, Table, Columns, Maximize, 
  Minimize, Power, RefreshCw, RotateCcw, Scissors, Paperclip, 
  Printer, Monitor, Smartphone, Tablet, Speaker, Mic, Video, 
  Camera, Eye, EyeOff, Lock, Unlock, Key, Radio, Siren, 
  FireExtinguisher, Stethoscope, Activity, CreditCard, DollarSign,
  Landmark, Users, UserPlus, UserCheck, UserX, Mail, Phone,
  MapPin, Gift, Award, ThumbsUp, HelpCircle
};

export const getIcon = (name: string | null | undefined) => {
  if (!name || !iconMap[name]) return FileText;
  return iconMap[name];
};