import { LucideIcon } from 'lucide-react';

export type SectionType = 'text' | 'list' | 'info' | 'warning';

export interface SubSection {
  title: string;
  content: string | string[];
  type: SectionType;
  images?: string[]; // optional array for multiple images
  downloadLink?: string;
  downloadLabel?: string;
}

export interface WikiPageData {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  sections: SubSection[];
}
