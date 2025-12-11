import { WikiPageData } from '../types';
import { 
  BookOpen, 
  Tag, 
  Truck, 
  Trash2, 
  ShieldCheck, 
  ClipboardCheck,
  Wrench
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
        images: [
                'https://github.com/Gerwin5478/Qualfon_OJT/blob/main/OJT%20FILES/TAG.png?raw=true',
                'https://github.com/Gerwin5478/Qualfon_OJT/blob/main/OJT%20FILES/awsd.png?raw=true'
  ]
      },
      {
        title: 'Step 6: Final Documentation',
        content: [
          'After properly recording the details, create a Receiving Report (RR).',
          'Once all steps are completed, the asset is ready for deployment or storage.'
        ],
        type: 'list',
        images:['https://github.com/Gerwin5478/Qualfon_OJT/blob/main/OJT%20FILES/dwaf.webp?raw=true'
        ],
        downloadLink: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7B88E365E0-213A-4F8F-8278-82D263DE1685%7D&file=Receiving-Report--2-.xlsx&action=default&mobileredirect=true',
        downloadLabel: 'Download Receiving Report (RR) File'
      },
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
          'The department or employee requesting an asset must submit a proper request, which is processed per internal procedures.',
          'Asset must be properly tagged',
          'Must be supported by "Acknowledgement Receipt " and "Accountability Agreement".',
          'Documents must be signed by the user upon receipt.',
          'The documents are to be properly signed by the recipient to confirm receipt',
          'Both User and Facilities Department retain copies.',
        ],
        type: 'list',
        downloadLink:'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FFO%2DFA001%2DFixed%2DAsset%2DIssuance%2DAccountability%2DAgreement%5FYUBIKEYS%2D1%2D%2D4%2D%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
        downloadLabel:'Download Accountability Agreement and Acknowledgement Receipt File'
      },
      {
          title: 'Transferring Assets',
          content: [
            'Requestor fills out Property/Equipment Transfer Form (Annex E).',
            'Obtain approvals and create 4 copies:\n', 
            '---• Original: Facilities (Property & Inventory)\n',
            '---• Duplicate: Requester\n', 
            '---• Triplicate: Accounting (Finance)\n', 
            "---• Quadruplicate: Guard's Copy",
            'Inventory personnel updates the FIXED ASSET FILE by adding a new entry to reflect the asset’s new location and status (DO NOT DELETE THE PREVIOUS RECORD)'
          ],
          type: 'list',
          downloadLink:
            'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BD60D3D15-73A2-442D-A054-39FDF2C5D8FB%7D&file=Equipment-Transfer-Form.xls&action=default&mobileredirect=true',
             downloadLabel: 'Download Equipment Transfer Form File'
        },
      {
        title: 'Work From Home (WFH)',
        content: 'Assets deployed for WFH are monitored by the Asset Custodian. Employees must abide by the Accountability Agreement. Returns must be supported by a "Fixed Asset Return Slip".',
        type: 'warning',

          downloadLink:'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FNOT%2DOFFICIAL%2DFixed%2DAsset%2DReturn%2DSlip%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
          downloadLabel: 'NOT OFFICIAL Fixed Asset Return Slip File'
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
  },
  {
    id: 'repair',
    title: 'Asset Repair',
    icon: Wrench,
    summary: 'How assets are evaluated if they are repairable or not',
    sections:[
      {
        title: 'Furniture & Fixtures / Machinery and Equipment',
        content: [
        'If the asset is damaged, quickly inform the security department and request assistance to check CCTV footage.',
        'Notify the OPS manager about the damaged asset.',
        'Request an incident report.'
        ],
        type: 'list',
        downloadLink: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FINCIDENT%2DREPORT%2DFORM%2DSAMPLE%2DBY%2DOJT%2DNOT%2DOFFICIAL%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
        downloadLabel: 'NOT OFFICIAL Incident Report File'
      },
      {
        title: 'IT Equipment',
        content: [
          'If the IT equipment is repairable, the IT technician will carry out the repairs and the process is done',
          'If not, the inventory personnel gather hard copy documents',
          'Delivery Receipt or Invoice and Incident Report from IT Department',
          'Scan and email it to procurement for assistance and ask if the asset is still under warranty',
          'if the asset is under warranty, the damaged asset will be replaced with a new one'
        ],
        type: 'list',
        downloadLink: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FINCIDENT%2DREPORT%2DFORM%2DSAMPLE%2DBY%2DOJT%2DNOT%2DOFFICIAL%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
        downloadLabel: 'NOT OFFICIAL Incident Report File'
       
        },
      {
          title: 'IT Equipment - Damaged or Lost by Employee',
          content: [
            'Employee must immediately report the damage/loss to their supervisor and Facilities Department and file an Incident Report.',
            'Facilities Department investigates the incident whether it is (Intentional act, Negligence, Accident )',
            'As per Fixed Asset Issuance Accountability Agreement the employee must pay for the damages',
            'Employee has 2 payment option (Outright cash payment, Salary deduction on agreed terms)',
            'Forward Incident Report and other supporting documents to Person Office'

          ] ,
          type: 'list',
          downloadLink: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BD6CB9514-E59E-459F-8CF0-F0B0F5FE5568%7D&file=Asset-Assessment-Report.xlsx&action=default&mobileredirect=true',
          downloadLabel: 'Asset Assessment Report File',
          
      },
      {
          title: 'Work From Home (WFH) Damaged Assets',
          content: [
            'Facilities Department submits Incident Report to Person Office',
            'Same deduction calculation applies',
            'Employee must comply with WFH Policies and Accountability Agreement',
          ],
          type: 'list',

          downloadLink: 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/Forms/AllItems.aspx?id=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines%2FINCIDENT%2DREPORT%2DFORM%2DSAMPLE%2DBY%2DOJT%2DNOT%2DOFFICIAL%2Epdf&parent=%2Fpersonal%2Ffrancis%5Ftadena%5Fqualfon%5Fcom%2FSiteAssets%2FSitePages%2FKPI%2DCreation%2DProcess%2D%26%2DGuidelines',
          downloadLabel: 'NOT OFFICIAL Incident Report File'
}

    ]
  }