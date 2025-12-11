export interface SubSection {
  title: string;
  content: string | string[]; // Can be a paragraph or a list of items
  type?: 'text' | 'list' | 'warning' | 'info';
  image?:string;
}

export interface WikiPageData {
  id: string;
  title: string;
  icon: any; // Using Lucide icons
  summary: string;
  sections: SubSection[];
}

export enum DocType {
  POLICY = 'FD-06',
  FORM = 'ANNEX',
}