import { WikiPageData } from '../types';
import { 
  BookOpen, 
  Tag, 
  Truck, 
  Trash2, 
  ShieldCheck, 
  ClipboardCheck,
  Wrench,
  Circle,
  Home,
  Settings

} from 'lucide-react';

export const wikiContent: WikiPageData[] = [
  {
    id: 'introduction',
    title: 'Purpose & Scope',
    icon: BookOpen,
    category: 'Fixed Asset Procedures',
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
    category: 'Fixed Asset Procedures',
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
    category: 'Fixed Asset Procedures',
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
                'https://github.com/Gerwin5478/OJT-FILES/blob/main/adw.jpg?raw=true',
                'https://github.com/Gerwin5478/OJT-FILES/blob/main/content.png?raw=true',
  ]
      },
      {
        title: 'Step 6: Final Documentation',
        content: [
          'After properly recording the details, create a Receiving Report (RR).',
          'Once all steps are completed, the asset is ready for deployment or storage.'
        ],
        type: 'list',
        images:['https://github.com/Gerwin5478/OJT-FILES/blob/main/content.webp?raw=true'
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
    category: 'Fixed Asset Procedures',
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
    category: 'Fixed Asset Procedures',
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
        content:[
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
    title: 'Asset Disposal',
    icon: Trash2,
    category: 'Fixed Asset Procedures',
    summary: 'Procedures for retiring, selling, or donating assets.',
    sections: [
      {
        title: 'Authorization',
        content: 'No asset shall be disposed of without proper authorization (Asset Disposal Form). Compliance with PEZA/BOI is required.',
        type: 'warning'
      },
      {
          title: 'Asset Disposal Form',
          content: 'Official document used to request and approve the disposal of assets. Must be signed by the relevant approvers.',
          type: 'text',
          downloadLink: 'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BB1F4292B-828B-4AA0-9966-1C9793FE69AE%7D&file=FD09_Asset-Disposal-Form-V2_022023--1-.xlsx&action=default&mobileredirect=true',
          downloadLabel: 'Asset Disposal Form'         
      },
      {
          title: 'Asset Disposition Delegation of Authority',
          content: 'Document outlining who has the authority to approve the disposal, based on asset value/type.',
          type: 'text',
          images:[
              'https://github.com/Gerwin5478/OJT-FILES/blob/main/Screenshot%202025-12-12%20013526.png?raw=true'

          ],
      },

      {
        title: '(FOR IT Equipment) Assessment Report',
        content: "Required for IT equipment disposal, detailing the IT Department's assessment of the asset's condition and validity of disposal.",
        type: 'text',
        downloadLink:'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BFD3EBCFA-06CF-4E45-BEB8-903F820604A4%7D&file=IT-Equipment-Assessment-Report..xlsx&action=default&mobileredirect=true',
        downloadLabel:'IT Equipment Assessment Report File'
      },
      {
        title: 'IT Equipment Disposal Thru Scrap Sales',
        content: ['Initiation/Identification of Asset for Disposal using Asset Disposal Form',
        'Assessment of IT Equipment using IT Equipment Assessment Report',
        'Bidding Process (Assisted by Procurement)',
        'Evaluation and Selection of Buyer',
        'Approval - Asset Disposal Form (reflecting the final bidder, approved by management/CoFO) ',
        'Actual Disposal - Documentation of actual disposal witnessed by Facilities, Finance, and security' 
        ],
        type: 'list'
      },
      {
        title: '(FOR NON IT EQUIPMENT) Asset Assessment Report',
        content: "Required for Non-IT related asset disposal, detailing the Facilities Department's assessment of the asset's condition and validity of disposal.",
        type: 'text',
        downloadLink:'https://qualfon-my.sharepoint.com/:x:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc2.aspx?action=edit&sourcedoc=%7Bd6cb9514-e59e-459f-8cf0-f0b0f5fe5568%7D&wdOrigin=TEAMS-WEB.undefined_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1765522860236&web=1',
        downloadLabel:'Asset Assessment Report File()'
        },
      {
        title: 'NON IT Equipment Disposal Thru Scrap Sales',
        content: ['Initiation/Identification of Asset for Disposal using Asset Disposal Form   ', 
        'Assessment of Non-IT Equipment using Asset Assessment Report ',
        'Bidding Process (Assisted by Procurement)',
        'Evaluation and Selection of Buyer',
        'Approval - Asset Disposal Form (reflecting the final bidder, approved by management/CoFO)',
        'Actual Disposal -Documentation of actual disposal witnessed by Facilities, Finance, and security',
        ],
        type: 'list'
      },
      {
        title: 'Prerequisites',
        content: ['The donation must not reduce the Company’s production capacity or workforce, unless the reduction has been pre-approved, and the assets are considered excess or idle',
        ],
        type: 'warning'
      },

      {
        title: 'Asset Disposal thru Donation',
        content: ['Identification and Assessment using IT Asset Assessment Report or Asset Assessment Report',
        'Approval - Asset Disposal Form, signed by authorized approvers',
        'Confirmation of Donation- Deed of Donation or similar document transferring ownership',
        ],
        type: 'list'
      },
    ]
  },
  {
    id: 'repair',
    title: 'Asset Repair',
    icon: Wrench,
    category: 'Fixed Asset Procedures',
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
  },
  {
    id: 'eee-page',
    title: 'Housekeeping',
    icon: Home,
    category: 'HOUSEKEEPING AND MAINTENANCE',
    summary: 'This page provides an overview of the company’s cleanliness and proceedures',
    sections: [
      {
        title: 'Daily Monitoring Activities HouseKeeping ',
        content:[ 'Cleaning and Dusting of Workstation',
        'Disinfection of Computer Equipment',
        'Cleaning and Disinfection of Restroom',
        'Cleaning and Disinfection of Common Area',
        'Garbage Collection and Disposal',
        'Clearing Garbage Bins',
        'Cleaning / Vacumming of Operation Area',
        'Cleaning / Vacumming of Offices',
        'Water Dispenser Cleaning'
        ],
        type: 'list',

        downloadLink:'https://qualfon-my.sharepoint.com/:p:/r/personal/francis_tadena_qualfon_com/_layouts/15/Doc.aspx?sourcedoc=%7BC444688B-E4FC-452C-BAEB-F4E9C4A46108%7D&file=sample-daily.pptx&action=edit&mobileredirect=true',
        downloadLabel:'Download Examples',
        additionalDownloads: [
           {
             label: 'Download Checklist',
             link: '#' 
           }
        ]
      }
      
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    category:'HOUSEKEEPING AND MAINTENANCE',
    icon: Settings,
    summary: 'This page shows the maintenance proceedures',
    sections: [
      {
        title: 'Equipment and Machinery Maintenance',
        content: '',
        type: 'text'
      }









    ]
  }
]