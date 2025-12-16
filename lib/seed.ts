import { supabase } from './supabase';
import { wikiContent } from '../data/wikiContent';

// Manual mapping of Page ID to Icon Name string for the database
const idToIcon: Record<string, string> = {
  'introduction': 'BookOpen',
  'responsibilities': 'ShieldCheck',
  'tagging': 'Tag',
  'issuance': 'Truck',
  'gate-pass': 'DoorClosed',
  'monitoring': 'ClipboardCheck',
  'disposal': 'Trash2',
  'repair': 'Wrench',
  'eee-page': 'Home',
  'blank-sub-category': 'Brush',
  'Nightshiftsop': 'Brush',
  'maintenance': 'Settings',
  'weekly-maintenance': 'Settings',
  'monthly-maintenance': 'Settings',
  'quarterly-maintenance': 'Settings',
  'security': 'ShieldAlert'
};

const formsList = [
    {
      category: 'Asset Management',
      items: [
        {
          title: 'Receiving Report (RR)',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7B88E365E0-213A-4F8F-8278-82D263DE1685%7D&file=Receiving-Report--2-.xlsx&action=default&mobileredirect=true',
          description: 'Document used to officially record and validate the receipt of goods and materials into the facility.'
        },
        {
          title: 'Accountability Agreement',
          url: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FFO%2DFA001%2DFixed%2DAsset%2DIssuance%2DAccountability%2DAgreement%5FYUBIKEYS%2D1%2D%2D4%2D%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
          description: 'Legal document where the employee acknowledges responsibility for issued assets (keys, devices, etc.).'
        },
        {
          title: 'Equipment Transfer Form',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BD60D3D15-73A2-442D-A054-39FDF2C5D8FB%7D&file=Equipment-Transfer-Form.xls&action=default&mobileredirect=true',
          description: 'Required form when moving assets between departments, floors, or different locations.'
        },
        {
          title: 'Gate Pass Form',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/melvin_abogatal_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BC3432E89-ACB8-49E1-A5E4-511DD9CAD934%7D&file=Gatepass.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1',
          description: 'Mandatory security permit for any asset or equipment leaving the company premises.'
        },
        {
          title: 'Fixed Asset Return Slip (Unofficial)',
          url: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FNOT%2DOFFICIAL%2DFixed%2DAsset%2DReturn%2DSlip%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
          description: 'Used when returning assets to the custodian (e.g., upon resignation, transfer, or replacement).'
        },
      ]
    },
    {
      category: 'Disposal & Incidents',
      items: [
        {
          title: 'Asset Disposal Form',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BB1F4292B-828B-4AA0-9966-1C9793FE69AE%7D&file=FD09_Asset-Disposal-Form-V2_022023--1-.xlsx&action=default&mobileredirect=true',
          description: 'Official request document to dispose of broken, obsolete, or excess assets.'
        },
        {
          title: 'IT Equipment Assessment Report',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BFD3EBCFA-06CF-4E45-BEB8-903F820604A4%7D&file=IT-Equipment-Assessment-Report..xlsx&action=default&mobileredirect=true',
          description: 'Technical evaluation form by IT Dept confirming an IT asset is defective and unrepairable.'
        },
        {
          title: 'Asset Assessment Report (Non-IT)',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc2.aspx?action=edit&sourcedoc=%7Bd6cb9514-e59e-459f-8cf0-f0b0f5fe5568%7D&wdOrigin=TEAMS-WEB.undefined_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1765522860236&web=1',
          description: 'Facilities assessment for furniture and fixtures confirming physical condition for disposal.'
        },
        {
          title: 'CBAR Form (Unofficial)',
          url: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/SitePages/KPI-Creation-Process-&-Guidelines/Doc1.docx?web=1',
          description: 'Cost-Benefit Analysis Report used to evaluate and compare bids for scrap sales.'
        },
        {
          title: 'Incident Report Sample (Unofficial)',
          url: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FINCIDENT%2DREPORT%2DFORM%2DSAMPLE%2DBY%2DOJT%2DNOT%2DOFFICIAL%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
          description: 'Standard template for reporting lost, stolen, or damaged assets to security/facilities.'
        },
      ]
    },
    {
      category: 'Maintenance & Housekeeping',
      items: [
        {
          title: 'Daily Housekeeping Examples',
          url: 'https://qualfon-my.sharepoint.com/:p:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BC444688B-E4FC-452C-BAEB-F4E9C4A46108%7D&file=sample-daily.pptx&action=edit&mobileredirect=true',
          description: 'Visual guide and presentation for expected daily cleanliness standards.'
        },
        {
          title: 'Night Shift Pantry Checklist',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7B9EC43974-F58E-4FDF-A3A1-C7E18CB0E420%7D&file=Checklist-Night-Shift-Male-Trashbin-Pantry---Copy.xlsx&action=default&mobileredirect=true',
          description: 'Task list for maintaining pantry cleanliness and supplies during night shifts.'
        },
        {
          title: 'Daily UPS Maintenance Checklist',
          url: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7B3E79E8DD-01B8-4C3A-8AF8-B5496EAB5A28%7D&file=UPS-Maintenance-Checklist.xlsx&action=default&mobileredirect=true',
          description: 'Log sheet for monitoring UPS status, including battery, alarms, and ventilation.'
        },
        {
          title: 'Weekly Maintenance Tasks',
          url: 'https://qualfon-my.sharepoint.com/:w:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7B52E7614E-2770-4597-A061-81E9AAA40AA2%7D&file=Weekly-Tasks.docx&action=default&mobileredirect=true',
          description: 'Schedule and checklist of maintenance activities to be performed weekly.'
        },
        {
          title: 'Monthly Maintenance Tasks',
          url: 'https://qualfon-my.sharepoint.com/:w:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7B0FCFC4D2-E9A7-4D5E-ADE9-7B6324072FC1%7D&file=Monthly-Tasks.docx&action=default&mobileredirect=true',
          description: 'Schedule and checklist of maintenance activities to be performed monthly.'
        },
        {
          title: 'Quarterly Maintenance Tasks',
          url: 'https://qualfon-my.sharepoint.com/:w:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BFD5EA540-E8FA-4A39-8005-54796380ED10%7D&file=Quarterly-Task.docx&action=default&mobileredirect=true',
          description: 'Schedule and checklist of comprehensive maintenance activities to be performed quarterly.'
        }
      ]
    }
];

export const seedDatabase = async () => {
  console.log('Starting seed...');
  
  // 1. Clear existing data (optional, but good for reset)
  // Be careful with this in production!
  await supabase.from('wiki_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('wiki_pages').delete().neq('id', 'intro'); 
  await supabase.from('forms').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Insert Pages
  let sortOrder = 0;
  for (const page of wikiContent) {
    sortOrder++;
    const { error: pageError } = await supabase.from('wiki_pages').insert({
      id: page.id,
      title: page.title,
      icon_name: idToIcon[page.id] || 'FileText',
      category: page.category,
      summary: page.summary,
      parent_page_id: page.parentPageId || null,
      sort_order: sortOrder
    });

    if (pageError) console.error(`Error inserting page ${page.id}:`, pageError);

    // 3. Insert Sections for this page
    let sectionSort = 0;
    for (const section of page.sections) {
      sectionSort++;
      const { error: sectionError } = await supabase.from('wiki_sections').insert({
        page_id: page.id,
        title: section.title,
        content: section.content, // Supabase handles JSONB conversion
        section_type: section.type || 'text',
        images: section.images || [],
        download_link: section.downloadLink,
        download_label: section.downloadLabel,
        additional_downloads: section.additionalDownloads,
        sort_order: sectionSort
      });
      if (sectionError) console.error(`Error inserting section for ${page.id}:`, sectionError);
    }
  }

  // 4. Insert Forms
  for (const group of formsList) {
    for (const item of group.items) {
      const { error: formError } = await supabase.from('forms').insert({
        title: item.title,
        url: item.url,
        description: item.description,
        category: group.category
      });
      if (formError) console.error(`Error inserting form ${item.title}:`, formError);
    }
  }

  console.log('Seeding complete!');
  return true;
};