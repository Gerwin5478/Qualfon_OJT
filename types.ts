import { LucideIcon } from 'lucide-react';

export type SectionType = 'text' | 'list' | 'info' | 'warning' | 'image'| 'table';

export interface TableItem {
  label: string;
  link?: string;
}

export interface DownloadButton {
  label: string;
  link: string;
}

export interface SubSection {
  title: string;
  content: string | (string | TableItem)[];
  type: SectionType;
  images?: string[]; // optional array for multiple images
  downloadLink?: string;
  downloadLabel?: string;
  additionalDownloads?: DownloadButton[];
  imageUrl?: string[]; 
  data?: string[]
}

export interface WikiPageData {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  sections: SubSection[];
  category?: string;
}