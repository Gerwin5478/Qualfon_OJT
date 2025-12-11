import { WikiPageData } from '../types';
import { 
  BookOpen, 
  Tag, 
  Truck, 
  Trash2, 
  ShieldCheck, 
  ClipboardCheck 
} from 'lucide-react';

export const wikiContent: WikiPageData[] = [
  {
    id: 'introduction',
    title: 'Purpose & Scope',
    icon: BookOpen,
    summary: 'General guidelines for Fixed Asset Accounting and Management based on Policy FD-06.',
    sections: [
      {
        title: 'Purpose',
        content: 'This policy establishes general guidelines for proper Fixed Asset Accounting and Management. It covers Recognition & Derecognition, Impairment, and Issuance & Management of Assets. It complies with IFRS 16, IAS 16, IAS 2, and IAS 36.',
        type: 'text'
      },
      {
        title: 'Scope',
        content: [
          'All fixed assets and inventoriable assets identified by the Company.',
          'Does not supersede Accounting Standards for property, plant & equipment, and inventories.',
          'Excludes procedures for requisition (covered by other policies).'
        ],
        type: 'list'
      },
      {
        title: 'Key Definitions',
        content: [
          'Fixed Asset: Tangible property held for use in production/supply of goods/services, rental, or admin purposes, used for >12 months.',
          'Inventoriable Assets: Items not meeting capitalization threshold but require monitoring (e.g., Headsets, Keyboards, Mouse).',
          'Capitalization Threshold: Php 50,000 or $1,500 per item (Note: IT equipment like CPUs/Laptops are capitalized regardless of amount).'
        ],
        type: 'info'
      }
    ]
  },
  {
    id: 'responsibilities',
    title: 'Responsibilities',
    icon: ShieldCheck,
    summary: 'Roles of Facilities, Finance, and Department Requestors.',
    sections: [
      {
        title: 'Facilities Department',
        content: [
          'Tagging assets before issuance.',
          'Preparing supporting documents (Delivery Acceptance, etc.).',
          'Safeguarding assets as the Asset Custodian.',
          'Monitoring loaned assets and ensuring timely returns.',
          'Supervising disposal processes and compliance with PEZA/BOI.',
          'Reporting changes in asset condition (transfer, loss, obsolescence) to Finance.'
        ],
        type: 'list'
      },
      {
        title: 'Department Requestor / Employee',
        content: [
          'Receiving and acknowledging receipt of assets.',
          'Safekeeping of assets (especially for Work From Home).',
          'Returning assets in the same condition upon separation or return-to-office orders.'
        ],
        type: 'list'
      }
    ]
  },
  {
    id: 'tagging',
    title: 'Receiving, Tagging & Storage',
    icon: Tag,
    summary: 'Step-by-step Standard Operating Procedures for receiving, inspecting, tagging, and storing assets.',
    sections: [
      {
        title: 'Step 1: Receipt & Inspection',
        content: [
          'Inventory personnel receives and inspects the incoming asset.',
          'Ensure the item is free from damages.',
          'Verify that the item matches the items ordered in the Purchase Order/Delivery Receipt.',
          'Place the items received in the designated facilities staging area.'
        ],
        type: 'list'
      },
      {
        title: 'Step 2: IT Evaluation',
        content: 'If the items received are IT related (e.g., Laptops, Desktops, Servers), call the IT Department for proper asset evaluation. If the items are NOT IT related, proceed directly to Step 3.',
        type: 'warning'
      },
      {
        title: 'Step 3: Asset Record Verification',
        content: 'Check the FIXED ASSET file (Master List) to determine the last asset tag number used. This ensures no duplicate tags are created.',
        type: 'text'
      },
      {
        title: 'Step 4: Tag Assignment & Format',
        content: 'Assign a unique asset tag in sequential order, following the previous tag number. The tag format must follow the asset classification below:',
        type: 'text'
      },
      {
        title: 'Asset Tag Formats',
        content: [
          'Furniture and Fixtures: CDFF####',
          'Machinery and Equipment: CDME####',
          'IT Equipment: CDIE####'
        ],
        type: 'info'
      },
      {
        title: 'Step 5: Tagging the Asset',
        content: [
          'Print the asset tag.',
          'Affix it securely to the asset in a clearly visible location.',
          'Ensure the asset tag number and serial number match the details recorded in the Fixed Asset file.'
        ],
        type: 'list',
        image: 'https://github.com/Gerwin5478/OJT_Qualfon/blob/main/TAG.png?raw=true'
      },
      {
        title: 'Step 6: Final Documentation',
        content: [
          'After properly recording the details, create a Receiving Report (RR).',
          'Once all steps are completed, the asset is ready for deployment or storage.'
        ],
        type: 'list'
      }
    ]
  },
  {
    id: 'issuance',
    title: 'Issuance & Transfer',
    icon: Truck,
    summary: 'Moving assets between users, departments, or locations.',
    sections: [
      {
        title: 'Issuance to Users',
        content: [
          'Must be supported by "Fixed Asset Delivery Acceptance Receipt" and "Accountability Agreement".',
          'Documents must be signed by the user upon receipt.',
          'Both User and Facilities Department retain copies.'
        ],
        type: 'list'
      },
      {
        title: 'Transferring Assets',
        content: [
          'Internal Transfer (Floor to Floor): Use "Property/Equipment Transfer Form".',
          'External Transfer (Outside Building): Use "Gate Pass".',
          'Forms require 4 copies: Bearer, Facilities, Finance, and Security.'
        ],
        type: 'list'
      },
      {
        title: 'Work From Home (WFH)',
        content: 'Assets deployed for WFH are monitored by the Asset Custodian. Employees must abide by the Accountability Agreement. Returns must be supported by a "Fixed Asset Return Slip".',
        type: 'warning'
      }
    ]
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Counts',
    icon: ClipboardCheck,
    summary: 'Annual physical counts and maintenance of asset schedules.',
    sections: [
      {
        title: 'Asset Schedules',
        content: 'Finance maintains the Fixed Asset Schedule (capitalized items) and Inventory Schedule (low-value items). Facilities maintains a Custodian Listing.',
        type: 'text'
      },
      {
        title: 'Reconciliation',
        content: 'Facilities submits their listing to Finance every 25th of the month for reconciliation.',
        type: 'info'
      },
      {
        title: 'Physical Count',
        content: [
          'Conducted at least annually.',
          'Methods: "List-to-Floor" (verify existence) and "Floor-to-List" (verify completeness).',
          '100% physical count required within a 5-year cycle.',
          'Discrepancies must be investigated and settled within 10 days.'
        ],
        type: 'list'
      }
    ]
  },
  {
    id: 'disposal',
    title: 'Disposal',
    icon: Trash2,
    summary: 'Procedures for retiring, selling, or donating assets.',
    sections: [
      {
        title: 'Authorization',
        content: 'No asset shall be disposed of without proper authorization (Asset Disposal Form). Compliance with PEZA/BOI is required.',
        type: 'warning'
      },
      {
        title: 'Documentation Required',
        content: [
          'Asset Disposal Form (Annex H)',
          'IT Equipment Assessment Report (ITEAR) for IT assets.',
          'Asset Assessment Report (AAR) for non-IT assets.',
          'Cost-Benefit Analysis Report (CBAR) for scrap sales.'
        ],
        type: 'list'
      },
      {
        title: 'Bidding Policy',
        content: 'Sale of scraps requires at least 3 qualified bidders. Assisted by Procurement Department. The final buyer is chosen based on CBAR results.',
        type: 'text'
      },
      {
        title: 'Hopeless Cases (Unreturned Assets)',
        content: 'If an employee separates and fails to return assets after 3 attempts, it is declared a "Hopeless Case". Finance derecognizes the asset and deductions may apply.',
        type: 'text'
      }
    ]
  }
];