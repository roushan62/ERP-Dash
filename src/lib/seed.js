import { buildDefaultPermissions } from './permissions.js'
import { MODULES } from './modules.js'
import { uid, daysAgo, daysAhead, monthOffset, today } from './utils.js'

const P = (id) => id

export function seedState() {
  const now = new Date().toISOString()

  const users = [
    { id: 'u1', name: 'Aakash Jain', email: 'admin@aura.in', role: 'admin', department: 'IT & Systems', phone: '+91 98200 11001', scope: 'all', active: true, lastLogin: now },
    { id: 'u2', name: 'Rajesh Malhotra', email: 'rajesh@aura.in', role: 'management', department: 'Management', phone: '+91 98200 11002', scope: 'all', active: true, lastLogin: daysAgo(1) },
    { id: 'u3', name: 'Amit Verma', email: 'amit@aura.in', role: 'pm', department: 'Projects', phone: '+91 98200 11003', scope: 'all', active: true, lastLogin: daysAgo(0) },
    { id: 'u4', name: 'Neha Gupta', email: 'neha@aura.in', role: 'sales', department: 'Sales', phone: '+91 98200 11004', scope: 'all', active: true, lastLogin: daysAgo(2) },
    { id: 'u5', name: 'Kavita Joshi', email: 'kavita@aura.in', role: 'accounts', department: 'Finance', phone: '+91 98200 11005', scope: 'all', active: true, lastLogin: daysAgo(0) },
    { id: 'u6', name: 'Rohit Singh', email: 'rohit@aura.in', role: 'hr', department: 'HR', phone: '+91 98200 11006', scope: 'all', active: true, lastLogin: daysAgo(1) },
    { id: 'u7', name: 'Sana Khan', email: 'sana@aura.in', role: 'procurement', department: 'Procurement', phone: '+91 98200 11007', scope: 'all', active: true, lastLogin: daysAgo(0) },
    { id: 'u8', name: 'Vikas Yadav', email: 'vikas@aura.in', role: 'site', department: 'Site Execution', phone: '+91 98200 11008', scope: 'assigned', active: true, lastLogin: daysAgo(0) },
    { id: 'u9', name: 'Anjali Mehta', email: 'anjali@aura.in', role: 'designer', department: 'Design', phone: '+91 98200 11009', scope: 'all', active: true, lastLogin: daysAgo(3) },
  ]

  const employees = [
    { id: 'e1', empCode: 'AUR-001', name: 'Rajesh Malhotra', designation: 'Director', department: 'Management', phone: '+91 98200 11002', email: 'rajesh@aura.in', joinDate: '2015-04-01', ctc: 4800000, status: 'Active' },
    { id: 'e2', empCode: 'AUR-002', name: 'Aakash Jain', designation: 'ERP Administrator', department: 'IT & Systems', phone: '+91 98200 11001', email: 'admin@aura.in', joinDate: '2018-06-10', ctc: 900000, status: 'Active' },
    { id: 'e3', empCode: 'AUR-003', name: 'Amit Verma', designation: 'Senior Project Manager', department: 'Projects', phone: '+91 98200 11003', email: 'amit@aura.in', joinDate: '2017-11-20', ctc: 2100000, status: 'Active' },
    { id: 'e4', empCode: 'AUR-004', name: 'Neha Gupta', designation: 'Sales Manager', department: 'Sales', phone: '+91 98200 11004', email: 'neha@aura.in', joinDate: '2019-02-11', ctc: 1400000, status: 'Active' },
    { id: 'e5', empCode: 'AUR-005', name: 'Kavita Joshi', designation: 'Accounts Head', department: 'Finance', phone: '+91 98200 11005', email: 'kavita@aura.in', joinDate: '2016-08-01', ctc: 1300000, status: 'Active' },
    { id: 'e6', empCode: 'AUR-006', name: 'Rohit Singh', designation: 'HR Manager', department: 'HR', phone: '+91 98200 11006', email: 'rohit@aura.in', joinDate: '2018-09-03', ctc: 1000000, status: 'Active' },
    { id: 'e7', empCode: 'AUR-007', name: 'Sana Khan', designation: 'Purchase Head', department: 'Procurement', phone: '+91 98200 11007', email: 'sana@aura.in', joinDate: '2019-05-19', ctc: 1150000, status: 'Active' },
    { id: 'e8', empCode: 'AUR-008', name: 'Vikas Yadav', designation: 'Site Engineer', department: 'Site Execution', phone: '+91 98200 11008', email: 'vikas@aura.in', joinDate: '2021-01-04', ctc: 540000, status: 'Active' },
    { id: 'e9', empCode: 'AUR-009', name: 'Deepak Nair', designation: 'Site Engineer', department: 'Site Execution', phone: '+91 98200 11009', email: 'deepak@aura.in', joinDate: '2021-07-12', ctc: 510000, status: 'Active' },
    { id: 'e10', empCode: 'AUR-010', name: 'Anjali Mehta', designation: 'Lead Designer', department: 'Design', phone: '+91 98200 11010', email: 'anjali@aura.in', joinDate: '2018-03-15', ctc: 1200000, status: 'Active' },
    { id: 'e11', empCode: 'AUR-011', name: 'Farhan Ali', designation: 'Junior Designer', department: 'Design', phone: '+91 98200 11011', email: 'farhan@aura.in', joinDate: '2023-02-06', ctc: 480000, status: 'Active' },
    { id: 'e12', empCode: 'AUR-012', name: 'Meena Iyer', designation: 'Accountant', department: 'Finance', phone: '+91 98200 11012', email: 'meena@aura.in', joinDate: '2020-10-01', ctc: 620000, status: 'Active' },
    { id: 'e13', empCode: 'AUR-013', name: 'Sunil Patil', designation: 'Store Keeper', department: 'Store & Inventory', phone: '+91 98200 11013', email: 'sunil@aura.in', joinDate: '2020-04-20', ctc: 400000, status: 'Active' },
    { id: 'e14', empCode: 'AUR-014', name: 'Ramesh Kumar', designation: 'Site Supervisor', department: 'Site Execution', phone: '+91 98200 11014', email: 'ramesh@aura.in', joinDate: '2019-12-09', ctc: 520000, status: 'Active' },
    { id: 'e15', empCode: 'AUR-015', name: 'Pooja Desai', designation: 'HR Executive', department: 'HR', phone: '+91 98200 11015', email: 'pooja@aura.in', joinDate: '2022-06-13', ctc: 430000, status: 'Active' },
    { id: 'e16', empCode: 'AUR-016', name: 'Arjun Reddy', designation: 'MEP Engineer', department: 'Site Execution', phone: '+91 98200 11016', email: 'arjun@aura.in', joinDate: '2021-09-27', ctc: 680000, status: 'Active' },
    { id: 'e17', empCode: 'AUR-017', name: 'Sandeep Rao', designation: 'Billing Engineer', department: 'Projects', phone: '+91 98200 11017', email: 'sandeep@aura.in', joinDate: '2022-01-17', ctc: 600000, status: 'Active' },
    { id: 'e18', empCode: 'AUR-018', name: 'Kiran Shah', designation: 'BD Executive', department: 'Sales', phone: '+91 98200 11018', email: 'kiran@aura.in', joinDate: '2023-08-21', ctc: 520000, status: 'On Notice' },
    { id: 'e19', empCode: 'AUR-019', name: 'Manoj Tiwari', designation: 'Electrician (Contract)', department: 'Site Execution', phone: '+91 98200 11019', email: 'manoj.t@aura.in', joinDate: '2024-03-04', ctc: 320000, status: 'Active' },
    { id: 'e20', empCode: 'AUR-020', name: 'Suresh Yadav', designation: 'Carpentry Foreman', department: 'Site Execution', phone: '+91 98200 11020', email: 'suresh@aura.in', joinDate: '2019-07-08', ctc: 460000, status: 'Active' },
  ]

  const clients = [
    { id: 'c1', name: 'Tata Consultancy Services', contactPerson: 'Prakash Menon', phone: '+91 22 6667 8000', email: 'facilities@tcs.com', industry: 'IT / ITES', city: 'Mumbai', gstin: '27AABCT1234A1Z5', status: 'Active', since: '2021-06-15' },
    { id: 'c2', name: 'Godrej Properties', contactPerson: 'Sunita Raghavan', phone: '+91 22 2518 9010', email: 'pmo@godrejproperties.com', industry: 'Real Estate', city: 'Mumbai', gstin: '27AAACG5678B1Z2', status: 'Active', since: '2022-01-10' },
    { id: 'c3', name: 'Nykaa Fashion', contactPerson: 'Aditi Rao', phone: '+91 22 4000 5555', email: 'retail.ops@nykaa.com', industry: 'Retail / E-commerce', city: 'Mumbai', gstin: '27AACCN9012C1Z8', status: 'Active', since: '2023-03-22' },
    { id: 'c4', name: 'Specialty Restaurants Ltd', contactPerson: 'Vikram Ombale', phone: '+91 20 6720 1000', email: 'projects@speciality.co.in', industry: 'Hospitality / F&B', city: 'Pune', gstin: '27AAACS3456D1Z3', status: 'Active', since: '2023-11-05' },
    { id: 'c5', name: 'Infosys BPM', contactPerson: 'Harish Prabhu', phone: '+91 20 4140 8000', email: 'admin.pune@infosysbpm.com', industry: 'IT / ITES', city: 'Pune', gstin: '27AAACI2345E1Z6', status: 'Active', since: '2020-09-14' },
    { id: 'c6', name: 'Lodha Group', contactPerson: 'Ritu Srivastava', phone: '+91 22 6789 0000', email: 'vendor@lodhagroup.com', industry: 'Real Estate', city: 'Thane', gstin: '27AAACL6789F1Z1', status: 'Active', since: '2019-08-30' },
    { id: 'c7', name: 'Amazon Transport Services', contactPerson: 'Daniel Fernandes', phone: '+91 22 8800 1234', email: 'facilities.west@amazon.com', industry: 'Logistics', city: 'Bhiwandi', gstin: '27AAACA4567G1Z9', status: 'Active', since: '2024-02-18' },
    { id: 'c8', name: 'Mr. Rohan Kapoor', contactPerson: 'Rohan Kapoor', phone: '+91 98450 67890', email: 'rohan.kapoor@gmail.com', industry: 'Individual / HNI', city: 'Alibaug', gstin: '—', status: 'Active', since: '2025-12-01' },
  ]

  const projects = [
    { id: 'p1', code: 'AUR-P-001', name: 'TCS Corporate Office Fitout — Powai', client: 'Tata Consultancy Services', type: 'Office Fitout', location: 'Powai, Mumbai', area: 42000, budget: 63000000, spent: 41600000, startDate: daysAgo(190), endDate: daysAhead(75), manager: 'Amit Verma', progress: 68, status: 'Ongoing', billingType: 'Milestone Based' },
    { id: 'p2', code: 'AUR-P-002', name: 'Godrej HQ 4th Floor — BKC', client: 'Godrej Properties', type: 'Office Fitout', location: 'BKC, Mumbai', area: 28000, budget: 42000000, spent: 13800000, startDate: daysAgo(95), endDate: daysAhead(140), manager: 'Amit Verma', progress: 35, status: 'Ongoing', billingType: 'Monthly RA Bills' },
    { id: 'p3', code: 'AUR-P-003', name: 'Luxury Villa Interiors — Alibaug', client: 'Mr. Rohan Kapoor', type: 'Residential Interior', location: 'Alibaug, Raigad', area: 6500, budget: 18000000, spent: 6100000, startDate: daysAgo(120), endDate: daysAhead(60), manager: 'Deepak Nair', progress: 42, status: 'Ongoing', billingType: 'Stage Payment' },
    { id: 'p4', code: 'AUR-P-004', name: 'Nykaa Retail Store — Linking Road', client: 'Nykaa Fashion', type: 'Retail Fitout', location: 'Bandra West, Mumbai', area: 3200, budget: 9500000, spent: 8300000, startDate: daysAgo(150), endDate: daysAhead(12), manager: 'Amit Verma', progress: 90, status: 'Ongoing', billingType: 'Fixed Price' },
    { id: 'p5', code: 'AUR-P-005', name: 'Café Mocha Flagship — Koregaon Park', client: 'Specialty Restaurants Ltd', type: 'Hospitality Fitout', location: 'Koregaon Park, Pune', area: 4500, budget: 13500000, spent: 900000, startDate: daysAhead(20), endDate: daysAhead(200), manager: 'Amit Verma', progress: 8, status: 'Planning', billingType: 'Fixed Price' },
    { id: 'p6', code: 'AUR-P-006', name: 'Infosys BPM 9th Floor Fitout — Hinjawadi', client: 'Infosys BPM', type: 'Office Fitout', location: 'Hinjawadi Phase 2, Pune', area: 36000, budget: 51000000, spent: 26200000, startDate: daysAgo(140), endDate: daysAhead(85), manager: 'Amit Verma', progress: 52, status: 'Ongoing', billingType: 'Milestone Based' },
    { id: 'p7', code: 'AUR-P-007', name: 'Lodha Amara Clubhouse & Lobby', client: 'Lodha Group', type: 'Civil + Interior', location: 'Thane West', area: 12000, budget: 27000000, spent: 26100000, startDate: daysAgo(400), endDate: daysAgo(20), manager: 'Amit Verma', progress: 100, status: 'Completed', billingType: 'Milestone Based' },
    { id: 'p8', code: 'AUR-P-008', name: 'Amazon Warehouse Office Block — Bhiwandi', client: 'Amazon Transport Services', type: 'Civil Construction', location: 'Bhiwandi, Thane', area: 18000, budget: 34000000, spent: 9200000, startDate: daysAgo(210), endDate: daysAhead(45), manager: 'Deepak Nair', progress: 27, status: 'On Hold', billingType: 'RA Bills' },
  ]

  const leads = [
    { id: 'l1', companyName: 'Mercedes-Benz India R&D', contactPerson: 'Anil Kulkarni', phone: '+91 98600 22110', email: 'anil.k@mb.com', source: 'Referral', location: 'Pune', requirement: '30,000 sqft office fitout — 2 floors, lounge + workstations', budget: 45000000, status: 'Qualified', assignedTo: 'Neha Gupta', nextFollowUp: daysAhead(2), notes: 'Met facilities head. RFP expected next month.' },
    { id: 'l2', companyName: 'Zudio — 4 Store Rollout', contactPerson: 'Meera Shetty', phone: '+91 98190 44521', email: 'projects@zudio.com', source: 'IndiaMART', location: 'Mumbai / Thane', requirement: 'Retail fitout for 4 stores, ~2500 sqft each', budget: 9000000, status: 'Proposal Sent', assignedTo: 'Kiran Shah', nextFollowUp: daysAhead(1), notes: 'Sent budgetary quote. Decided vendor by month end.' },
    { id: 'l3', companyName: 'Blue Orchid Hospitals', contactPerson: 'Dr. Neha Kulkarni', phone: '+91 98220 77345', email: 'admin@blueorchid.in', source: 'Website', location: 'Chembur, Mumbai', requirement: 'OPD floor interiors + reception area', budget: 12000000, status: 'Site Visit', assignedTo: 'Neha Gupta', nextFollowUp: daysAhead(3), notes: 'Site visit scheduled. Needs healthcare-compliant materials.' },
    { id: 'l4', companyName: 'Kaleidoscope Ad Agency', contactPerson: 'Joy Fernandez', phone: '+91 99300 11223', email: 'joy@kaleido.in', source: 'Houzz', location: 'Lower Parel, Mumbai', requirement: 'Creative office with breakout zones, 12,000 sqft', budget: 18000000, status: 'New', assignedTo: 'Kiran Shah', nextFollowUp: daysAhead(1), notes: '' },
    { id: 'l5', companyName: 'Standard Chartered GBS', contactPerson: 'Ravindra Joshi', phone: '+91 22 6760 9000', email: 'ravindra.j@sc.com', source: 'Tender', location: 'Airoli, Navi Mumbai', requirement: 'Campus cafeteria + gym fitout', budget: 26000000, status: 'Contacted', assignedTo: 'Neha Gupta', nextFollowUp: daysAhead(5), notes: 'Empanelment form submitted.' },
    { id: 'l6', companyName: 'BrewBench Café Chain', contactPerson: 'Tanmay Deshpande', phone: '+91 90280 33445', email: 'tanmay@brewbench.in', source: 'Exhibition', location: 'Pune / Mumbai', requirement: 'Rollout of 6 café outlets — design + build', budget: 15000000, status: 'Qualified', assignedTo: 'Kiran Shah', nextFollowUp: daysAhead(4), notes: 'Met at IIID exhibition. Sample café first.' },
    { id: 'l7', companyName: 'Mrs. Latha Raghavan (Penthouse)', contactPerson: 'Latha Raghavan', phone: '+91 98450 99887', email: 'latha.r@gmail.com', source: 'Referral', location: 'Worli, Mumbai', requirement: '3,800 sqft penthouse — full turnkey interiors', budget: 22000000, status: 'Won', assignedTo: 'Neha Gupta', nextFollowUp: '', notes: 'Won! Advance received, kick-off next week.' },
    { id: 'l8', companyName: 'Trident Logistics', contactPerson: 'Gurpreet Singh', phone: '+91 98110 66554', email: 'gs@tridentlog.com', source: 'IndiaMART', location: 'Bhiwandi', requirement: 'Warehouse admin block interior, 8,000 sqft', budget: 6500000, status: 'Lost', assignedTo: 'Kiran Shah', nextFollowUp: '', notes: 'Lost to local contractor on price. Keep for future.' },
    { id: 'l9', companyName: 'Evolv Fitness Studios', contactPerson: 'Karan Wahi', phone: '+91 99870 22119', email: 'karan@evolvfit.in', source: 'Walk-in', location: 'Andheri West', requirement: '2 fitness studio fitouts — flooring, mirrors, AV', budget: 7500000, status: 'Contacted', assignedTo: 'Neha Gupta', nextFollowUp: daysAhead(2), notes: '' },
    { id: 'l10', companyName: 'Aarvi Kids Pre-School', contactPerson: 'Shweta Jain', phone: '+91 98675 44556', email: 'shweta@aarvikids.in', source: 'Website', location: 'Kharghar, Navi Mumbai', requirement: 'Pre-school interior — 6,000 sqft, child-safe materials', budget: 8500000, status: 'Proposal Sent', assignedTo: 'Kiran Shah', nextFollowUp: daysAhead(6), notes: 'Detailed BOQ shared with brand guideline references.' },
    { id: 'l11', companyName: 'Photon Semiconductors', contactPerson: 'Dr. Iyer', phone: '+91 90040 77889', email: 'office@photonsemi.com', source: 'Referral', location: 'Whitefield referral — Mumbai office', requirement: 'Clean-room adjacent office, 15,000 sqft', budget: 30000000, status: 'New', assignedTo: 'Neha Gupta', nextFollowUp: daysAhead(3), notes: '' },
    { id: 'l12', companyName: 'Chai Point Kiosk Network', contactPerson: 'Amit Boss', phone: '+91 98200 55440', email: 'amit.b@chaipoint.com', source: 'Exhibition', location: 'Mumbai', requirement: '20 mall kiosks — modular units', budget: 6000000, status: 'Lost', assignedTo: 'Kiran Shah', nextFollowUp: '', notes: 'Client went with in-house fabrication.' },
  ]

  const quotations = [
    { id: 'q1', quoteNo: 'AUR-Q-2026-014', clientName: 'Tata Consultancy Services', projectName: 'TCS Corporate Office Fitout — Powai', scope: 'Complete office fitout — civil, MEP, furniture, AV. 42,000 sqft', area: 42000, value: 63000000, marginPct: 18, validUntil: daysAhead(25), status: 'Approved', createdBy: 'Neha Gupta' },
    { id: 'q2', quoteNo: 'AUR-Q-2026-018', clientName: 'Zudio — 4 Store Rollout', projectName: 'Zudio Store Rollout — Phase 1', scope: 'Retail fitout for 4 stores incl. façade and signage support', area: 10000, value: 9200000, marginPct: 15, validUntil: daysAhead(9), status: 'Sent', createdBy: 'Kiran Shah' },
    { id: 'q3', quoteNo: 'AUR-Q-2026-012', clientName: 'Blue Orchid Hospitals', projectName: 'OPD Floor Interiors', scope: 'OPD interiors with anti-microbial finishes, nurse stations', area: 9000, value: 12800000, marginPct: 17, validUntil: daysAhead(14), status: 'Sent', createdBy: 'Neha Gupta' },
    { id: 'q4', quoteNo: 'AUR-Q-2026-019', clientName: 'Kaleidoscope Ad Agency', projectName: 'Creative Studio Office', scope: 'Design & build — workstations, studio, breakout zones', area: 12000, value: 18500000, marginPct: 19, validUntil: daysAhead(20), status: 'Draft', createdBy: 'Kiran Shah' },
    { id: 'q5', quoteNo: 'AUR-Q-2026-008', clientName: 'Mrs. Latha Raghavan (Penthouse)', projectName: 'Worli Penthouse Interiors', scope: 'Turnkey interiors — Italian marble, joinery, automation', area: 3800, value: 22500000, marginPct: 22, validUntil: daysAgo(4), status: 'Approved', createdBy: 'Neha Gupta' },
    { id: 'q6', quoteNo: 'AUR-Q-2026-011', clientName: 'Aarvi Kids Pre-School', projectName: 'Aarvi Kids Kharghar', scope: 'Child-safe interiors, soft flooring, custom furniture', area: 6000, value: 8700000, marginPct: 16, validUntil: daysAhead(11), status: 'Revised', createdBy: 'Kiran Shah' },
    { id: 'q7', quoteNo: 'AUR-Q-2026-006', clientName: 'Trident Logistics', projectName: 'Warehouse Admin Block', scope: 'Admin office interiors with pantry and conference', area: 8000, value: 6800000, marginPct: 14, validUntil: daysAgo(18), status: 'Rejected', createdBy: 'Kiran Shah' },
    { id: 'q8', quoteNo: 'AUR-Q-2026-003', clientName: 'Specialty Restaurants Ltd', projectName: 'Café Mocha Flagship', scope: 'Hospitality fitout — kitchen coordination, seating, bar', area: 4500, value: 13500000, marginPct: 20, validUntil: daysAhead(30), status: 'Approved', createdBy: 'Neha Gupta' },
  ]

  const vendors = [
    { id: 'v1', name: 'Shree Ganesh Plywood & Laminates', category: 'Plywood & Laminates', contactPerson: 'Mahesh Gupta', phone: '+91 98210 33441', email: 'sales@sgply.com', gstin: '27AAGFS1234K1Z9', city: 'Mumbai', rating: 4.5, status: 'Active', remarks: 'Best rates for MR grade ply. 30-day credit.' },
    { id: 'v2', name: 'DryWall Systems Pvt Ltd', category: 'Ceiling & Drywall', contactPerson: 'Rakesh Bansal', phone: '+91 98110 22110', email: 'info@drywallsystems.in', gstin: '07AABCD5678L1Z2', city: 'Delhi NCR', rating: 4.2, status: 'Active', remarks: 'Gypsum board + grid supply & installation.' },
    { id: 'v3', name: 'CoolAir HVAC Solutions', category: 'HVAC', contactPerson: 'Farookh Shaikh', phone: '+91 99870 66778', email: 'projects@coolairhvac.com', gstin: '27AAFCC9012M1Z6', city: 'Mumbai', rating: 4.0, status: 'Active', remarks: 'VRV & ducting specialist. Approved with TCS.' },
    { id: 'v4', name: 'Spark Electricals', category: 'Electrical', contactPerson: 'Imran Qureshi', phone: '+91 98200 90112', email: 'imran@sparkelec.in', gstin: '27AAEFS3456N1Z3', city: 'Mumbai', rating: 4.6, status: 'Active', remarks: 'Licensed contractor. HT/LT work.' },
    { id: 'v5', name: 'GlassCraft Industries', category: 'Glass & Glazing', contactPerson: 'Dinesh Shah', phone: '+91 98450 11223', email: 'dinesh@glasscraft.co.in', gstin: '29AAFCG7890P1Z1', city: 'Bengaluru', rating: 3.8, status: 'Active', remarks: 'Toughened glass, frameless partitions.' },
    { id: 'v6', name: 'Prime Furniture Works', category: 'Furniture & Joinery', contactPerson: 'Jaswinder Singh', phone: '+91 98111 55667', email: 'jas@primefurniture.in', gstin: '07AAFCP2345Q1Z7', city: 'Noida', rating: 4.4, status: 'Active', remarks: 'Factory-finished joinery, workstation systems.' },
    { id: 'v7', name: 'SafeGuard Fire Systems', category: 'Firefighting', contactPerson: 'Prasad Kulkarni', phone: '+91 90280 88990', email: 'prasad@safeguardfire.in', gstin: '27AAFCS6789R1Z4', city: 'Pune', rating: 4.1, status: 'Active', remarks: 'Fire NOC liaison also provided.' },
    { id: 'v8', name: 'ColourCraft Painting Co.', category: 'Painting & Finishes', contactPerson: 'Bhaskar Salvi', phone: '+91 99300 44556', email: 'bhaskar@colourcraft.in', gstin: '27AAFCS0123S1Z0', city: 'Mumbai', rating: 3.9, status: 'On Hold', remarks: 'Quality dip in last job — under review.' },
    { id: 'v9', name: 'TileWorld Imports', category: 'Flooring', contactPerson: 'Nikhil Agarwal', phone: '+91 98204 66778', email: 'nikhil@tileworld.in', gstin: '27AAFCT4567T1Z2', city: 'Mumbai', rating: 4.3, status: 'Active', remarks: 'Italian marble, large format tiles.' },
    { id: 'v10', name: 'Shakti Manpower Services', category: 'Manpower / Labour', contactPerson: 'Bhola Prasad', phone: '+91 82910 12345', email: 'bhola@shaktimanpower.in', gstin: '27AAFCS8910U1Z8', city: 'Mumbai', rating: 3.5, status: 'Active', remarks: 'Provides carpentry & housekeeping gangs.' },
  ]

  const materialRequests = [
    { id: 'mr1', reqNo: 'MR-26-019', projectId: P('p1'), items: '12mm Gypsum Board — 400 sqm; GI Channel — 220 nos', requiredBy: daysAhead(7), priority: 'High', requestedBy: 'Vikas Yadav', status: 'Pending Approval', remarks: 'Ceiling work blocked at 7th floor zone.' },
    { id: 'mr2', reqNo: 'MR-26-020', projectId: P('p1'), items: 'LED Panel 36W — 350 nos; 2x2 grid — 300 nos', requiredBy: daysAhead(12), priority: 'Medium', requestedBy: 'Arjun Reddy', status: 'Approved', remarks: '' },
    { id: 'mr3', reqNo: 'MR-26-021', projectId: P('p4'), items: 'Vinyl plank flooring — 1,800 sqft', requiredBy: daysAhead(4), priority: 'Critical', requestedBy: 'Ramesh Kumar', status: 'Ordered', remarks: 'PO issued to TileWorld.' },
    { id: 'mr4', reqNo: 'MR-26-022', projectId: P('p2'), items: '19mm MR Plywood — 260 sqm; Laminates — 180 sheets', requiredBy: daysAhead(15), priority: 'High', requestedBy: 'Deepak Nair', status: 'Pending Approval', remarks: 'For joinery kick-off.' },
    { id: 'mr5', reqNo: 'MR-26-023', projectId: P('p6'), items: 'Cat-6 cabling — 40 boxes; Faceplates — 600 nos', requiredBy: daysAhead(10), priority: 'Medium', requestedBy: 'Arjun Reddy', status: 'Approved', remarks: '' },
    { id: 'mr6', reqNo: 'MR-26-018', projectId: P('p3'), items: 'Italian marble — 2,400 sqft (Statuario)', requiredBy: daysAhead(18), priority: 'High', requestedBy: 'Deepak Nair', status: 'Ordered', remarks: 'Client approved slab photos.' },
    { id: 'mr7', reqNo: 'MR-26-017', projectId: P('p8'), items: 'Cement 50kg — 600 bags; River sand — 120 brass', requiredBy: daysAgo(2), priority: 'High', requestedBy: 'Ramesh Kumar', status: 'Delivered', remarks: 'Consumed for plinth beams.' },
    { id: 'mr8', reqNo: 'MR-26-024', projectId: P('p5'), items: 'BOQ finalization pending — tentative list', requiredBy: daysAhead(25), priority: 'Low', requestedBy: 'Amit Verma', status: 'Draft', remarks: '' },
    { id: 'mr9', reqNo: 'MR-26-016', projectId: P('p1'), items: 'Fire-rated doors — 22 nos', requiredBy: daysAhead(9), priority: 'Medium', requestedBy: 'Vikas Yadav', status: 'Rejected', remarks: 'Spec mismatch — revised spec requested from consultant.' },
  ]

  const purchaseOrders = [
    { id: 'po1', poNo: 'PO-26-041', vendorId: 'v2', projectId: P('p1'), orderDate: daysAgo(22), expectedDelivery: daysAhead(3), value: 3850000, paymentTerms: '30 days credit', status: 'Sent', remarks: 'Gypsum + grid supply for zones A-C.' },
    { id: 'po2', poNo: 'PO-26-042', vendorId: 'v1', projectId: P('p2'), orderDate: daysAgo(12), expectedDelivery: daysAhead(5), value: 2460000, paymentTerms: '30 days credit', status: 'Confirmed', remarks: 'Ply + laminates for joinery.' },
    { id: 'po3', poNo: 'PO-26-038', vendorId: 'v3', projectId: P('p1'), orderDate: daysAgo(40), expectedDelivery: daysAgo(5), value: 5900000, paymentTerms: '20% advance, 80% on delivery', status: 'Partially Received', remarks: 'VRV outdoor units received; FCUs pending.' },
    { id: 'po4', poNo: 'PO-26-043', vendorId: 'v9', projectId: P('p4'), orderDate: daysAgo(6), expectedDelivery: daysAhead(2), value: 1150000, paymentTerms: '50% advance', status: 'Confirmed', remarks: 'Vinyl plank + skirting.' },
    { id: 'po5', poNo: 'PO-26-039', vendorId: 'v4', projectId: P('p6'), orderDate: daysAgo(30), expectedDelivery: daysAgo(8), value: 4100000, paymentTerms: '30 days credit', status: 'Received', remarks: 'Cables, DBs, fixtures — full received.' },
    { id: 'po6', poNo: 'PO-26-044', vendorId: 'v6', projectId: 'p2', orderDate: daysAgo(3), expectedDelivery: daysAhead(28), value: 6800000, paymentTerms: '30% advance, 70% against delivery', status: 'Draft', remarks: 'Workstation systems — awaiting client floor plan freeze.' },
    { id: 'po7', poNo: 'PO-26-036', vendorId: 'v10', projectId: P('p1'), orderDate: daysAgo(26), expectedDelivery: daysAgo(26), value: 1800000, paymentTerms: 'Weekly labour billing', status: 'Received', remarks: 'Carpentry gang of 24.' },
    { id: 'po8', poNo: 'PO-26-045', vendorId: 'v7', projectId: P('p6'), orderDate: daysAgo(1), expectedDelivery: daysAhead(20), value: 2250000, paymentTerms: '30 days credit', status: 'Sent', remarks: 'Sprinklers + extinguishers for 9th floor.' },
    { id: 'po9', poNo: 'PO-26-040', vendorId: 'v5', projectId: 'p3', orderDate: daysAgo(18), expectedDelivery: daysAhead(6), value: 1650000, paymentTerms: '40% advance', status: 'Confirmed', remarks: 'Frameless shower partitions + mirrors.' },
    { id: 'po10', poNo: 'PO-26-037', vendorId: 'v8', projectId: P('p4'), orderDate: daysAgo(35), expectedDelivery: daysAgo(20), value: 640000, paymentTerms: 'Advance', status: 'Cancelled', remarks: 'Vendor under review — shifted to in-house team.' },
  ]

  const grns = [
    { id: 'g1', grnNo: 'GRN-26-051', poNo: 'PO-26-038', vendorId: 'v3', date: daysAgo(5), items: 'VRV outdoor units — 8 nos', qty: 8, qcStatus: 'Passed', status: 'Posted', inspectedBy: 'Arjun Reddy', remarks: 'Serial numbers logged.' },
    { id: 'g2', grnNo: 'GRN-26-052', poNo: 'PO-26-039', vendorId: 'v4', date: daysAgo(8), items: 'Cat-6 boxes (40), DBs (12), fixtures (860)', qty: 912, qcStatus: 'Passed', status: 'Posted', inspectedBy: 'Sunil Patil', remarks: '' },
    { id: 'g3', grnNo: 'GRN-26-053', poNo: 'PO-26-041', vendorId: 'v2', date: daysAgo(2), items: 'Gypsum board 12mm — 160 sheets (partial)', qty: 160, qcStatus: 'Pending', status: 'Draft', inspectedBy: 'Vikas Yadav', remarks: 'Balance 240 sheets expected in 3 days.' },
    { id: 'g4', grnNo: 'GRN-26-049', poNo: 'PO-26-036', vendorId: 'v10', date: daysAgo(26), items: 'Carpentry gang mobilization (24 pax)', qty: 24, qcStatus: 'Passed', status: 'Posted', inspectedBy: 'Ramesh Kumar', remarks: '' },
    { id: 'g5', grnNo: 'GRN-26-050', poNo: 'PO-26-037', vendorId: 'v8', date: daysAgo(20), items: 'Return of advance material — job cancelled', qty: 0, qcStatus: 'Rework', status: 'Posted', inspectedBy: 'Sana Khan', remarks: 'Credit note received.' },
    { id: 'g6', grnNo: 'GRN-26-054', poNo: 'PO-26-042', vendorId: 'v1', date: daysAgo(1), items: 'MR plywood 19mm — 120 sqm (partial)', qty: 120, qcStatus: 'Pending', status: 'Draft', inspectedBy: 'Sunil Patil', remarks: 'BWP check pending on batch 2.' },
    { id: 'g7', grnNo: 'GRN-26-048', poNo: 'PO-26-039', vendorId: 'v4', date: daysAgo(11), items: 'Sample lot — rejected, thin gauge conduits', qty: 40, qcStatus: 'Failed', status: 'Posted', inspectedBy: 'Arjun Reddy', remarks: 'Sent back. Vendor warned.' },
  ]

  const materials = [
    { id: 'm1', sku: 'MAT-GYP-12', name: 'Gypsum Board 12mm', category: 'Ceiling & Drywall', unit: 'sqm', rate: 210, currentStock: 640, minStock: 400, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm2', sku: 'MAT-CHN-050', name: 'GI Ceiling Channel 50mm', category: 'Ceiling & Drywall', unit: 'nos', rate: 88, currentStock: 1850, minStock: 1000, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm3', sku: 'MAT-PLY-19', name: 'MR Plywood 19mm', category: 'Carpentry', unit: 'sqm', rate: 465, currentStock: 310, minStock: 250, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm4', sku: 'MAT-LAM-1', name: 'Laminate 1mm (Sundek)', category: 'Carpentry', unit: 'sheet', rate: 780, currentStock: 95, minStock: 120, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm5', sku: 'MAT-LED-36', name: 'LED Panel Light 36W 2x2', category: 'Electrical', unit: 'nos', rate: 640, currentStock: 420, minStock: 200, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm6', sku: 'MAT-VNL-2', name: 'Vinyl Plank Flooring', category: 'Flooring', unit: 'sqft', rate: 92, currentStock: 2100, minStock: 1500, warehouse: 'Site — Nykaa Bandra' },
    { id: 'm7', sku: 'MAT-CPT-50', name: 'Carpet Tiles 50cm', category: 'Flooring', unit: 'sqft', rate: 110, currentStock: 7800, minStock: 3000, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm8', sku: 'MAT-EMP-20', name: 'Emulsion Paint (Premium)', category: 'Painting', unit: 'ltr', rate: 340, currentStock: 260, minStock: 300, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm9', sku: 'MAT-CEM-50', name: 'Cement OPC 53 — 50kg', category: 'Civil', unit: 'bag', rate: 395, currentStock: 90, minStock: 200, warehouse: 'Site — Amazon Bhiwandi' },
    { id: 'm10', sku: 'MAT-MRB-12', name: 'TMT Rebar 12mm', category: 'Civil', unit: 'nos', rate: 780, currentStock: 340, minStock: 150, warehouse: 'Site — Amazon Bhiwandi' },
    { id: 'm11', sku: 'MAT-ACP-4', name: 'ACP Sheet 4mm', category: 'Façade', unit: 'sqm', rate: 1150, currentStock: 140, minStock: 60, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm12', sku: 'MAT-CAT6', name: 'Cat-6 Cable Box 305m', category: 'IT / ELV', unit: 'box', rate: 2350, currentStock: 48, minStock: 25, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm13', sku: 'MAT-GLS-10', name: 'Toughened Glass 10mm', category: 'Glass', unit: 'sqft', rate: 210, currentStock: 520, minStock: 300, warehouse: 'Site — Alibaug Villa' },
    { id: 'm14', sku: 'MAT-HRD-01', name: 'Hardware Kit (Hinges+Handles)', category: 'Carpentry', unit: 'set', rate: 540, currentStock: 130, minStock: 150, warehouse: 'Central Warehouse — Bhiwandi' },
    { id: 'm15', sku: 'MAT-WOL-50', name: 'Mineral Wool Insulation 50mm', category: 'Ceiling & Drywall', unit: 'sqm', rate: 165, currentStock: 620, minStock: 250, warehouse: 'Central Warehouse — Bhiwandi' },
  ]

  const stockTxns = [
    { id: 's1', date: daysAgo(2), type: 'Issue to Site', materialId: 'm1', qty: 160, projectId: P('p1'), warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: 'Against MR-26-019 (partial).' },
    { id: 's2', date: daysAgo(3), type: 'Inward', materialId: 'm5', qty: 350, projectId: P('p1'), warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: 'PO-26-042 follow-on order.' },
    { id: 's3', date: daysAgo(4), type: 'Issue to Site', materialId: 'm6', qty: 600, projectId: P('p4'), warehouse: 'Site — Nykaa Bandra', handledBy: 'Ramesh Kumar', remarks: 'Store area flooring.' },
    { id: 's4', date: daysAgo(6), type: 'Issue to Site', materialId: 'm7', qty: 2400, projectId: P('p1'), warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: '6th floor open office.' },
    { id: 's5', date: daysAgo(7), type: 'Inward', materialId: 'm12', qty: 40, projectId: P('p6'), warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: 'GRN-26-052.' },
    { id: 's6', date: daysAgo(9), type: 'Return', materialId: 'm3', qty: 45, projectId: P('p4'), warehouse: 'Site — Nykaa Bandra', handledBy: 'Ramesh Kumar', remarks: 'Excess returned after counter tops.' },
    { id: 's7', date: daysAgo(10), type: 'Issue to Site', materialId: 'm9', qty: 220, projectId: P('p8'), warehouse: 'Site — Amazon Bhiwandi', handledBy: 'Ramesh Kumar', remarks: 'Plinth beam pouring.' },
    { id: 's8', date: daysAgo(12), type: 'Transfer', materialId: 'm13', qty: 180, projectId: P('p3'), warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: 'Transfer to Alibaug site.' },
    { id: 's9', date: daysAgo(14), type: 'Adjustment', materialId: 'm8', qty: -20, projectId: '', warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: 'Damage/theft reconciliation.' },
    { id: 's10', date: daysAgo(1), type: 'Inward', materialId: 'm3', qty: 120, projectId: P('p2'), warehouse: 'Central Warehouse — Bhiwandi', handledBy: 'Sunil Patil', remarks: 'GRN-26-054 partial.' },
  ]

  const budgetHeads = [
    { id: 'b1', projectId: P('p1'), head: 'Ceiling & Drywall', estimated: 8200000, actual: 6100000, remarks: 'Zones A-B done.' },
    { id: 'b2', projectId: P('p1'), head: 'Electrical', estimated: 9500000, actual: 7300000, remarks: '' },
    { id: 'b3', projectId: P('p1'), head: 'HVAC', estimated: 11000000, actual: 8600000, remarks: '' },
    { id: 'b4', projectId: P('p1'), head: 'Furniture & Joinery', estimated: 16500000, actual: 9800000, remarks: 'Factory release started.' },
    { id: 'b5', projectId: P('p1'), head: 'Flooring', estimated: 7800000, actual: 5200000, remarks: '' },
    { id: 'b6', projectId: P('p2'), head: 'Ceiling & Drywall', estimated: 5600000, actual: 1900000, remarks: '' },
    { id: 'b7', projectId: P('p2'), head: 'Furniture & Joinery', estimated: 12500000, actual: 2600000, remarks: '' },
    { id: 'b8', projectId: P('p2'), head: 'Electrical', estimated: 6800000, actual: 2100000, remarks: '' },
    { id: 'b9', projectId: P('p3'), head: 'Flooring', estimated: 4200000, actual: 2900000, remarks: 'Italian marble procurement on.' },
    { id: 'b10', projectId: P('p3'), head: 'Furniture & Joinery', estimated: 7600000, actual: 2400000, remarks: '' },
    { id: 'b11', projectId: P('p4'), head: 'Storefront & Branding', estimated: 2200000, actual: 2050000, remarks: 'Near final.' },
    { id: 'b12', projectId: P('p4'), head: 'Flooring', estimated: 1300000, actual: 1250000, remarks: '' },
    { id: 'b13', projectId: P('p6'), head: 'Electrical', estimated: 8900000, actual: 4400000, remarks: '' },
    { id: 'b14', projectId: P('p6'), head: 'Ceiling & Drywall', estimated: 7100000, actual: 3900000, remarks: '' },
    { id: 'b15', projectId: P('p6'), head: 'Firefighting', estimated: 3400000, actual: 900000, remarks: '' },
    { id: 'b16', projectId: P('p8'), head: 'Civil Works', estimated: 18500000, actual: 7300000, remarks: 'On hold — client scope revision.' },
    { id: 'b17', projectId: P('p1'), head: 'Painting & Finishes', estimated: 3900000, actual: 1400000, remarks: '' },
    { id: 'b18', projectId: P('p1'), head: 'Contingency', estimated: 2500000, actual: 400000, remarks: '' },
  ]

  const subcontractors = [
    { id: 'sc1', name: 'Marol Carpentry Crew (S. Yadav)', trade: 'Carpentry & Joinery', contactPerson: 'Suresh Yadav', phone: '+91 98200 11020', projectId: P('p1'), contractValue: 5400000, paid: 3200000, status: 'Active' },
    { id: 'sc2', name: 'Metro Drywall Infra', trade: 'Ceiling & Drywall', contactPerson: 'Mahesh Pawar', phone: '+91 99870 12345', projectId: P('p1'), contractValue: 2900000, paid: 1900000, status: 'Active' },
    { id: 'sc3', name: 'PerfectFinish Painters', trade: 'Painting', contactPerson: 'Bhaskar Salvi', phone: '+91 99300 44556', projectId: P('p4'), contractValue: 640000, paid: 510000, status: 'Active' },
    { id: 'sc4', name: 'Zenith Stone Works', trade: 'Flooring & Marble', contactPerson: 'Iqbal Memon', phone: '+91 98450 33445', projectId: P('p3'), contractValue: 2600000, paid: 1400000, status: 'Active' },
    { id: 'sc5', name: 'TechnoBuild Civil', trade: 'Civil & RCC', contactPerson: 'E. Ramesh', phone: '+91 90280 66778', projectId: P('p8'), contractValue: 12800000, paid: 6100000, status: 'On Hold' },
    { id: 'sc6', name: 'GlowSign AV & Signage', trade: 'Signage & AV', contactPerson: 'Rishi Kapoor2', phone: '+91 98190 77889', projectId: P('p4'), contractValue: 480000, paid: 480000, status: 'Completed' },
  ]

  const drawings = [
    { id: 'd1', projectId: P('p1'), title: '7th Floor Reflected Ceiling Plan', number: 'AUR-P1-RCP-701', type: 'GFC', revision: 'R3', date: daysAgo(6), uploadedBy: 'Anjali Mehta', status: 'Approved', notes: 'Light layout revised as per client comments.' },
    { id: 'd2', projectId: P('p1'), title: 'Workstation Details — Open Office', number: 'AUR-P1-FUR-712', type: 'Detail', revision: 'R2', date: daysAgo(10), uploadedBy: 'Farhan Ali', status: 'Approved', notes: '' },
    { id: 'd3', projectId: P('p1'), title: 'Reception Bulkhead Section', number: 'AUR-P1-SEC-703', type: 'Section', revision: 'R1', date: daysAgo(15), uploadedBy: 'Anjali Mehta', status: 'In Review', notes: 'Awaiting structural sign-off.' },
    { id: 'd4', projectId: P('p2'), title: 'Furniture Layout — 4th Floor', number: 'AUR-P2-LAY-401', type: 'Layout', revision: 'R4', date: daysAgo(3), uploadedBy: 'Anjali Mehta', status: 'In Review', notes: 'Client to confirm head-count final list.' },
    { id: 'd5', projectId: P('p2'), title: 'Electrical Power & Data Layout', number: 'AUR-P2-MEP-405', type: 'MEP', revision: 'R2', date: daysAgo(8), uploadedBy: 'Arjun Reddy', status: 'Approved', notes: '' },
    { id: 'd6', projectId: P('p3'), title: 'Master Bedroom Elevation', number: 'AUR-P3-ELE-112', type: 'Elevation', revision: 'R5', date: daysAgo(4), uploadedBy: 'Farhan Ali', status: 'Approved', notes: 'Fluted panel detail finalized.' },
    { id: 'd7', projectId: P('p3'), title: 'Foyer 3D View', number: 'AUR-P3-3D-101', type: '3D', revision: 'R2', date: daysAgo(20), uploadedBy: 'Anjali Mehta', status: 'Approved', notes: '' },
    { id: 'd8', projectId: P('p4'), title: 'Storefront & Signage GFC', number: 'AUR-P4-GFC-201', type: 'GFC', revision: 'R6', date: daysAgo(30), uploadedBy: 'Farhan Ali', status: 'Superseded', notes: 'Superseded by R6 final.' },
    { id: 'd9', projectId: P('p5'), title: 'Concept Layout — Café Seating', number: 'AUR-P5-LAY-001', type: 'Layout', revision: 'R1', date: daysAgo(2), uploadedBy: 'Anjali Mehta', status: 'Draft', notes: 'Concept stage.' },
    { id: 'd10', projectId: P('p6'), title: '9th Floor Demolition Plan', number: 'AUR-P6-DEM-901', type: 'Layout', revision: 'R1', date: daysAgo(60), uploadedBy: 'Farhan Ali', status: 'Approved', notes: 'Executed.' },
  ]

  const tasks = [
    { id: 't1', projectId: P('p1'), title: 'Complete ceiling grid — Zone C (7th flr)', assignedTo: 'Vikas Yadav', priority: 'High', startDate: daysAgo(10), dueDate: daysAhead(5), progress: 70, status: 'In Progress', remarks: 'Boarding after MEP clearance.' },
    { id: 't2', projectId: P('p1'), title: 'FCU installation & ducting — 7th floor', assignedTo: 'Arjun Reddy', priority: 'Critical', startDate: daysAgo(15), dueDate: daysAhead(2), progress: 55, status: 'In Progress', remarks: 'Awaiting balance FCUs from CoolAir.' },
    { id: 't3', projectId: P('p1'), title: 'Site mobilization — 8th floor', assignedTo: 'Ramesh Kumar', priority: 'Medium', startDate: daysAhead(7), dueDate: daysAhead(18), progress: 0, status: 'Pending', remarks: '' },
    { id: 't4', projectId: P('p2'), title: 'Client sign-off on furniture layout R4', assignedTo: 'Anjali Mehta', priority: 'High', startDate: daysAgo(3), dueDate: daysAhead(3), progress: 40, status: 'In Progress', remarks: 'Follow-up scheduled.' },
    { id: 't5', projectId: P('p2'), title: 'Electrical first fix — west wing', assignedTo: 'Manoj Tiwari', priority: 'High', startDate: daysAgo(8), dueDate: daysAhead(9), progress: 35, status: 'In Progress', remarks: '' },
    { id: 't6', projectId: P('p3'), title: 'Italian marble laying — living area', assignedTo: 'Deepak Nair', priority: 'Critical', startDate: daysAgo(2), dueDate: daysAhead(16), progress: 15, status: 'In Progress', remarks: 'Slab inspection before laying.' },
    { id: 't7', projectId: P('p3'), title: 'Fluted panel fabrication — bedrooms', assignedTo: 'Suresh Yadav', priority: 'Medium', startDate: daysAgo(12), dueDate: daysAhead(8), progress: 60, status: 'In Progress', remarks: '' },
    { id: 't8', projectId: P('p4'), title: 'Vinyl flooring — store area', assignedTo: 'Ramesh Kumar', priority: 'Critical', startDate: daysAgo(4), dueDate: daysAhead(1), progress: 80, status: 'In Progress', remarks: 'Store opening on 12th!' },
    { id: 't9', projectId: P('p4'), title: 'Final cleaning & snag closure', assignedTo: 'Vikas Yadav', priority: 'High', startDate: daysAhead(2), dueDate: daysAhead(8), progress: 0, status: 'Pending', remarks: '' },
    { id: 't10', projectId: P('p4'), title: 'Trial lighting & façade sign-off', assignedTo: 'Arjun Reddy', priority: 'Medium', startDate: daysAgo(6), dueDate: daysAgo(1), progress: 100, status: 'Completed', remarks: 'Client happy.' },
    { id: 't11', projectId: P('p6'), title: 'Fire sprinkler network — 9th floor', assignedTo: 'Arjun Reddy', priority: 'High', startDate: daysAhead(4), dueDate: daysAhead(24), progress: 0, status: 'Pending', remarks: 'PO-26-045 in transit.' },
    { id: 't12', projectId: P('p6'), title: 'Demolition waste disposal — final clearance', assignedTo: 'Vikas Yadav', priority: 'Medium', startDate: daysAgo(20), dueDate: daysAgo(4), progress: 100, status: 'Completed', remarks: '' },
    { id: 't13', projectId: P('p6'), title: 'Server room precision AC install', assignedTo: 'Deepak Nair', priority: 'High', startDate: daysAgo(5), dueDate: daysAhead(11), progress: 30, status: 'In Progress', remarks: '' },
    { id: 't14', projectId: P('p7'), title: 'Handover documentation & as-built set', assignedTo: 'Sandeep Rao', priority: 'Medium', startDate: daysAgo(30), dueDate: daysAgo(12), progress: 100, status: 'Completed', remarks: 'Submitted to Lodha.' },
    { id: 't15', projectId: 'p8', title: 'Scope revision meeting minutes — client', assignedTo: 'Amit Verma', priority: 'High', startDate: daysAgo(6), dueDate: daysAhead(1), progress: 50, status: 'Blocked', remarks: 'Awaiting revised drawings from client consultant.' },
    { id: 't16', projectId: P('p5'), title: 'Kitchen equipment vendor finalization', assignedTo: 'Amit Verma', priority: 'High', startDate: daysAhead(2), dueDate: daysAhead(15), progress: 0, status: 'Pending', remarks: '' },
  ]

  const dailyLogs = [
    { id: 'dl1', projectId: P('p1'), date: daysAgo(1), weather: 'Sunny', manpower: 46, workSummary: 'Zone C ceiling grid 80% done. Electrical conduiting on 7th. Paint sample approval received for corridor.', hindrance: 'Material movement delayed due to lift shutdown 2 hrs.', reportedBy: 'Vikas Yadav', status: 'Approved' },
    { id: 'dl2', projectId: P('p2'), date: daysAgo(1), weather: 'Sunny', manpower: 28, workSummary: 'West wing first fix conduiting. Joinery shop drawings issued for master samples.', hindrance: '', reportedBy: 'Deepak Nair', status: 'Approved' },
    { id: 'dl3', projectId: P('p3'), date: daysAgo(1), weather: 'Cloudy', manpower: 34, workSummary: 'Marble laying started in living area. Bedroom panelling base done.', hindrance: 'Marble unloading blocked by narrow approach road in morning.', reportedBy: 'Deepak Nair', status: 'Submitted' },
    { id: 'dl4', projectId: P('p4'), date: daysAgo(1), weather: 'Sunny', manpower: 19, workSummary: 'Vinyl flooring 80%. Trial lighting done. Signage fabrication update received.', hindrance: '', reportedBy: 'Ramesh Kumar', status: 'Approved' },
    { id: 'dl5', projectId: P('p6'), date: daysAgo(1), weather: 'Rainy', manpower: 22, workSummary: 'Server room AC piping. Drywall framing east side. Rain slowed material inflow.', hindrance: 'Heavy rain 3 hrs — no ceiling work.', reportedBy: 'Vikas Yadav', status: 'Submitted' },
    { id: 'dl6', projectId: P('p1'), date: daysAgo(2), weather: 'Sunny', manpower: 44, workSummary: 'Gypsum boarding zone A. Grid completion zone B. Site cleaning drive.', hindrance: '', reportedBy: 'Vikas Yadav', status: 'Approved' },
    { id: 'dl7', projectId: P('p4'), date: daysAgo(2), weather: 'Sunny', manpower: 21, workSummary: 'Counter tops fixing. Trial of trial-room doors. Stock room racks arrived.', hindrance: '', reportedBy: 'Ramesh Kumar', status: 'Approved' },
    { id: 'dl8', projectId: P('p3'), date: daysAgo(3), weather: 'Cloudy', manpower: 30, workSummary: 'Base preparation for marble. Electrical points final check with client architect.', hindrance: '', reportedBy: 'Deepak Nair', status: 'Approved' },
  ]

  const qualityChecks = [
    { id: 'qc1', projectId: P('p1'), date: daysAgo(1), stage: 'Ceiling & Drywall', inspector: 'Amit Verma', result: 'Pass', remarks: 'Grid alignment within 3mm. Good.' },
    { id: 'qc2', projectId: P('p1'), date: daysAgo(3), stage: 'Electrical First Fix', inspector: 'Arjun Reddy', result: 'Fail', remarks: '2 junction boxes missing covers — rectified same day.' },
    { id: 'qc3', projectId: P('p1'), date: daysAgo(3), stage: 'Electrical First Fix', inspector: 'Arjun Reddy', result: 'Rework Needed', remarks: 'Conduit spacing non-uniform in zone B — redo 40m.' },
    { id: 'qc4', projectId: P('p3'), date: daysAgo(2), stage: 'Flooring', inspector: 'Deepak Nair', result: 'Pass', remarks: 'Bed-slide check OK before marble laying.' },
    { id: 'qc5', projectId: P('p4'), date: daysAgo(4), stage: 'Joinery', inspector: 'Amit Verma', result: 'Pass', remarks: 'Counter finish and edge banding approved.' },
    { id: 'qc6', projectId: P('p2'), date: daysAgo(5), stage: 'Marking', inspector: 'Deepak Nair', result: 'Pass', remarks: 'Layout marking matched R4 within tolerance.' },
    { id: 'qc7', projectId: P('p6'), date: daysAgo(6), stage: 'Drywall', inspector: 'Vikas Yadav', result: 'Rework Needed', remarks: 'Board screw spacing >200mm in patches — instructed.' },
    { id: 'qc8', projectId: P('p4'), date: daysAgo(8), stage: 'Painting', inspector: 'Amit Verma', result: 'Pass', remarks: 'Paint DFT verified. Signature wall approved.' },
  ]

  const safetyIncidents = [
    { id: 'si1', projectId: P('p1'), date: daysAgo(2), type: 'Near Miss', severity: 'Medium', reportedBy: 'Vikas Yadav', actionTaken: 'Material stack re-secured; toolbox talk on housekeeping conducted.', status: 'Closed' },
    { id: 'si2', projectId: P('p3'), date: daysAgo(5), type: 'First Aid', severity: 'Low', reportedBy: 'Deepak Nair', actionTaken: 'Minor cut during marble edge chamfering — dressed on site. Gloves made mandatory.', status: 'Closed' },
    { id: 'si3', projectId: P('p6'), date: daysAgo(8), type: 'Property Damage', severity: 'Medium', reportedBy: 'Vikas Yadav', actionTaken: 'Dumpers debris cracked fire sprinkler pipe — plumber repaired, cost recovered from agency.', status: 'Investigating' },
    { id: 'si4', projectId: P('p4'), date: daysAgo(12), type: 'Near Miss', severity: 'Low', reportedBy: 'Ramesh Kumar', actionTaken: 'Ladder slip near storefront — ladder replaced with platform. No injury.', status: 'Closed' },
    { id: 'si5', projectId: P('p8'), date: daysAgo(16), type: 'Minor Injury', severity: 'Medium', reportedBy: 'Ramesh Kumar', actionTaken: 'Rebar scrape on forearm — tetanus check done. Bar bending zone barricaded.', status: 'Closed' },
  ]

  const invoices = [
    { id: 'in1', invoiceNo: 'AUR/26-27/041', clientId: 'c1', projectId: P('p1'), date: monthOffset(0).slice(0, 10), dueDate: daysAhead(14), amount: 8400000, gstPct: 18, status: 'Sent', notes: 'RA Bill 6 — 7th floor milestones.' },
    { id: 'in2', invoiceNo: 'AUR/26-27/038', clientId: 'c2', projectId: P('p2'), date: daysAgo(10), dueDate: daysAhead(5), amount: 5600000, gstPct: 18, status: 'Partially Paid', notes: '40% received against mobilization.' },
    { id: 'in3', invoiceNo: 'AUR/26-27/036', clientId: 'c3', projectId: P('p4'), date: daysAgo(15), dueDate: daysAgo(1), amount: 3800000, gstPct: 18, status: 'Overdue', notes: 'Final 80% on completion — chase.' },
    { id: 'in4', invoiceNo: 'AUR/26-27/033', clientId: 'c5', projectId: P('p6'), date: daysAgo(22), dueDate: daysAgo(8), amount: 7200000, gstPct: 18, status: 'Partially Paid', notes: 'RA Bill 3.' },
    { id: 'in5', invoiceNo: 'AUR/26-27/030', clientId: 'c8', projectId: P('p3'), date: daysAgo(28), dueDate: daysAgo(14), amount: 3600000, gstPct: 18, status: 'Paid', notes: 'Stage 2 — flooring milestone.' },
    { id: 'in6', invoiceNo: 'AUR/26-27/027', clientId: 'c6', projectId: P('p7'), date: daysAgo(35), dueDate: daysAgo(21), amount: 2700000, gstPct: 18, status: 'Paid', notes: 'Retention release — 50%.' },
    { id: 'in7', invoiceNo: 'AUR/26-27/024', clientId: 'c1', projectId: P('p1'), date: daysAgo(45), dueDate: daysAgo(31), amount: 9100000, gstPct: 18, status: 'Paid', notes: 'RA Bill 5.' },
    { id: 'in8', invoiceNo: 'AUR/26-27/021', clientId: 'c7', projectId: P('p8'), date: daysAgo(50), dueDate: daysAgo(36), amount: 4500000, gstPct: 18, status: 'Paid', notes: 'RA Bill 2 before hold.' },
    { id: 'in9', invoiceNo: 'AUR/26-27/018', clientId: 'c5', projectId: P('p6'), date: monthOffset(1).slice(0, 10), dueDate: daysAgo(38), amount: 8300000, gstPct: 18, status: 'Paid', notes: 'RA Bill 2.' },
    { id: 'in10', invoiceNo: 'AUR/26-27/014', clientId: 'c3', projectId: P('p4'), date: monthOffset(1).slice(0, 10), dueDate: daysAgo(44), amount: 2850000, gstPct: 18, status: 'Paid', notes: 'Milestone 2 — civil & MEP.' },
    { id: 'in11', invoiceNo: 'AUR/26-27/009', clientId: 'c1', projectId: P('p1'), date: monthOffset(2).slice(0, 10), dueDate: daysAgo(70), amount: 7800000, gstPct: 18, status: 'Paid', notes: 'RA Bill 4.' },
    { id: 'in12', invoiceNo: 'AUR/26-27/004', clientId: 'c6', projectId: P('p7'), date: monthOffset(3).slice(0, 10), dueDate: daysAgo(100), amount: 8100000, gstPct: 18, status: 'Paid', notes: 'RA Bill 9 — clubhouse.' },
    { id: 'in13', invoiceNo: 'AUR/26-27/043', clientId: 'c4', projectId: P('p5'), date: daysAgo(1), dueDate: daysAhead(29), amount: 4050000, gstPct: 18, status: 'Draft', notes: 'Advance bill — 30% on kickoff.' },
  ]

  const expenses = [
    { id: 'ex1', date: daysAgo(1), projectId: P('p1'), vendorId: 'v2', category: 'Material', amount: 685000, paymentMode: 'NEFT', billNo: 'DS/26/1187', status: 'Approved', submittedBy: 'Sana Khan', remarks: 'Gypsum boards partial supply.' },
    { id: 'ex2', date: daysAgo(2), projectId: P('p4'), vendorId: 'sc3', category: 'Labour', amount: 142000, paymentMode: 'NEFT', billNo: 'PF/26/334', status: 'Approved', submittedBy: 'Ramesh Kumar', remarks: 'Painting final coat gang.' },
    { id: 'ex3', date: daysAgo(2), projectId: P('p3'), vendorId: '', category: 'Site Expense', amount: 18400, paymentMode: 'Cash', billNo: '—', status: 'Pending', submittedBy: 'Deepak Nair', remarks: 'Marble unloading labour + diesel for pump.' },
    { id: 'ex4', date: daysAgo(3), projectId: P('p1'), vendorId: 'v3', category: 'Material', amount: 3200000, paymentMode: 'RTGS', billNo: 'CA/26/991', status: 'Approved', submittedBy: 'Sana Khan', remarks: 'VRV outdoor units (PO-26-038 part).' },
    { id: 'ex5', date: daysAgo(4), projectId: P('p6'), vendorId: 'v4', category: 'Material', amount: 1640000, paymentMode: 'NEFT', billNo: 'SE/26/776', status: 'Approved', submittedBy: 'Sana Khan', remarks: '' },
    { id: 'ex6', date: daysAgo(5), projectId: P('p4'), vendorId: '', category: 'Travel', amount: 8600, paymentMode: 'UPI', billNo: '—', status: 'Reimbursed', submittedBy: 'Ramesh Kumar', remarks: 'Vendor visits — fuel + parking.' },
    { id: 'ex7', date: daysAgo(6), projectId: P('p2'), vendorId: 'v1', category: 'Material', amount: 980000, paymentMode: 'NEFT', billNo: 'SG/26/2210', status: 'Approved', submittedBy: 'Sana Khan', remarks: 'Ply advance 30%.' },
    { id: 'ex8', date: daysAgo(7), projectId: P('p1'), vendorId: '', category: 'Equipment Rental', amount: 235000, paymentMode: 'NEFT', billNo: 'YS/26/88', status: 'Pending', submittedBy: 'Vikas Yadav', remarks: 'Boom lift — 15 days.' },
    { id: 'ex9', date: daysAgo(9), projectId: P('p8'), vendorId: 'sc5', category: 'Labour', amount: 1150000, paymentMode: 'NEFT', billNo: 'TB/26/140', status: 'Approved', submittedBy: 'Deepak Nair', remarks: 'RA bill before hold.' },
    { id: 'ex10', date: daysAgo(11), projectId: P('p1'), vendorId: '', category: 'Professional Fees', amount: 450000, paymentMode: 'NEFT', billNo: 'CONS/26/21', status: 'Approved', submittedBy: 'Kavita Joshi', remarks: 'MEP consultant milestone.' },
    { id: 'ex11', date: monthOffset(1).slice(0, 10), projectId: P('p1'), vendorId: 'v10', category: 'Labour', amount: 980000, paymentMode: 'NEFT', billNo: 'SM/26/412', status: 'Approved', submittedBy: 'Sana Khan', remarks: 'Carpentry gang weekly bills.' },
    { id: 'ex12', date: monthOffset(1).slice(0, 10), projectId: P('p4'), vendorId: 'v9', category: 'Material', amount: 520000, paymentMode: 'NEFT', billNo: 'TW/26/556', status: 'Approved', submittedBy: 'Sana Khan', remarks: 'Vinyl advance.' },
    { id: 'ex13', date: monthOffset(2).slice(0, 10), projectId: P('p6'), vendorId: '', category: 'Site Expense', amount: 68000, paymentMode: 'Cash', billNo: '—', status: 'Approved', submittedBy: 'Vikas Yadav', remarks: 'Site consumables + PPE refill.' },
    { id: 'ex14', date: monthOffset(2).slice(0, 10), projectId: P('p1'), vendorId: '', category: 'Office', amount: 185000, paymentMode: 'NEFT', billNo: '—', status: 'Approved', submittedBy: 'Kavita Joshi', remarks: 'Head office allocation.' },
    { id: 'ex15', date: monthOffset(3).slice(0, 10), projectId: P('p7'), vendorId: 'v9', category: 'Material', amount: 3100000, paymentMode: 'RTGS', billNo: 'TW/26/318', status: 'Approved', submittedBy: 'Sana Khan', remarks: 'Granite + tiles final lot.' },
    { id: 'ex16', date: monthOffset(3).slice(0, 10), projectId: P('p7'), vendorId: 'v10', category: 'Labour', amount: 890000, paymentMode: 'NEFT', billNo: 'SM/26/290', status: 'Approved', submittedBy: 'Sana Khan', remarks: '' },
    { id: 'ex17', date: monthOffset(0).slice(0, 10), projectId: '', vendorId: '', category: 'Office', amount: 320000, paymentMode: 'NEFT', billNo: '—', status: 'Approved', submittedBy: 'Kavita Joshi', remarks: 'HO salaries allocation — admin staff.' },
    { id: 'ex18', date: daysAgo(8), projectId: P('p2'), vendorId: '', category: 'Other', amount: 45000, paymentMode: 'UPI', billNo: '—', status: 'Rejected', submittedBy: 'Deepak Nair', remarks: 'No bills attached — resubmit.' },
  ]

  const payments = [
    { id: 'py1', date: daysAgo(2), direction: 'Received', party: 'Tata Consultancy Services', against: 'Invoice', reference: 'AUR/26-27/024', amount: 10738000, mode: 'RTGS', status: 'Cleared' },
    { id: 'py2', date: daysAgo(10), direction: 'Received', party: 'Godrej Properties', against: 'Invoice', reference: 'AUR/26-27/038 (40%)', amount: 2643200, mode: 'NEFT', status: 'Cleared' },
    { id: 'py3', date: daysAgo(4), direction: 'Made', party: 'CoolAir HVAC Solutions', against: 'Purchase Order', reference: 'PO-26-038 part', amount: 3200000, mode: 'RTGS', status: 'Cleared' },
    { id: 'py4', date: daysAgo(5), direction: 'Made', party: 'Spark Electricals', against: 'Purchase Order', reference: 'PO-26-039', amount: 1640000, mode: 'NEFT', status: 'Cleared' },
    { id: 'py5', date: daysAgo(14), direction: 'Received', party: 'Mr. Rohan Kapoor', against: 'Invoice', reference: 'AUR/26-27/030', amount: 4248000, mode: 'NEFT', status: 'Cleared' },
    { id: 'py6', date: daysAgo(16), direction: 'Made', party: 'Shree Ganesh Plywood & Laminates', against: 'Purchase Order', reference: 'PO-26-042 advance', amount: 738000, mode: 'NEFT', status: 'Cleared' },
    { id: 'py7', date: daysAgo(20), direction: 'Made', party: 'Shakti Manpower Services', against: 'Expense', reference: 'Weekly labour', amount: 245000, mode: 'NEFT', status: 'Cleared' },
    { id: 'py8', date: daysAgo(22), direction: 'Received', party: 'Infosys BPM', against: 'Invoice', reference: 'AUR/26-27/033 (60%)', amount: 5103360, mode: 'RTGS', status: 'Cleared' },
    { id: 'py9', date: daysAgo(25), direction: 'Made', party: 'Zenith Stone Works', against: 'Expense', reference: 'RA marble work', amount: 900000, mode: 'NEFT', status: 'Pending' },
    { id: 'py10', date: monthOffset(1).slice(0, 10), direction: 'Received', party: 'Nykaa Fashion', against: 'Invoice', reference: 'AUR/26-27/014', amount: 3363000, mode: 'NEFT', status: 'Cleared' },
    { id: 'py11', date: monthOffset(2).slice(0, 10), direction: 'Received', party: 'Tata Consultancy Services', against: 'Invoice', reference: 'AUR/26-27/009', amount: 9204000, mode: 'RTGS', status: 'Cleared' },
    { id: 'py12', date: monthOffset(3).slice(0, 10), direction: 'Received', party: 'Lodha Group', against: 'Invoice', reference: 'AUR/26-27/004', amount: 9558000, mode: 'RTGS', status: 'Cleared' },
  ]

  const attendance = [
    { id: 'at1', date: today(), employeeName: 'Vikas Yadav', status: 'Present', inTime: '08:55', outTime: '18:30', remarks: 'TCS Powai site' },
    { id: 'at2', date: today(), employeeName: 'Deepak Nair', status: 'Present', inTime: '08:40', outTime: '18:10', remarks: 'Alibaug villa' },
    { id: 'at3', date: today(), employeeName: 'Ramesh Kumar', status: 'Present', inTime: '08:30', outTime: '19:00', remarks: 'Nykaa Bandra — store opening prep' },
    { id: 'at4', date: today(), employeeName: 'Arjun Reddy', status: 'Site Duty', inTime: '09:00', outTime: '', remarks: 'Infosys Pune + TCS Mumbai coordination' },
    { id: 'at5', date: today(), employeeName: 'Amit Verma', status: 'Present', inTime: '09:20', outTime: '', remarks: 'Client meeting — BKC' },
    { id: 'at6', date: today(), employeeName: 'Sunil Patil', status: 'Present', inTime: '08:45', outTime: '18:00', remarks: 'Bhiwandi warehouse' },
    { id: 'at7', date: today(), employeeName: 'Kiran Shah', status: 'Leave', inTime: '', outTime: '', remarks: 'CL approved' },
    { id: 'at8', date: today(), employeeName: 'Farhan Ali', status: 'Present', inTime: '09:55', outTime: '', remarks: 'Studio' },
    { id: 'at9', date: daysAgo(1), employeeName: 'Vikas Yadav', status: 'Present', inTime: '08:50', outTime: '18:25', remarks: '' },
    { id: 'at10', date: daysAgo(1), employeeName: 'Deepak Nair', status: 'Present', inTime: '08:35', outTime: '18:05', remarks: '' },
    { id: 'at11', date: daysAgo(1), employeeName: 'Ramesh Kumar', status: 'Present', inTime: '08:25', outTime: '19:10', remarks: '' },
    { id: 'at12', date: daysAgo(1), employeeName: 'Arjun Reddy', status: 'Present', inTime: '09:05', outTime: '18:40', remarks: '' },
    { id: 'at13', date: daysAgo(2), employeeName: 'Vikas Yadav', status: 'Present', inTime: '08:55', outTime: '18:30', remarks: '' },
    { id: 'at14', date: daysAgo(2), employeeName: 'Kiran Shah', status: 'Half Day', inTime: '10:00', outTime: '14:00', remarks: 'Personal work' },
  ]

  const leaves = [
    { id: 'lv1', employeeName: 'Kiran Shah', type: 'CL', from: today(), to: today(), days: 1, reason: 'Family function', status: 'Approved', approvedBy: 'Rohit Singh' },
    { id: 'lv2', employeeName: 'Vikas Yadav', type: 'EL', from: daysAhead(9), to: daysAhead(13), days: 5, reason: 'Sister’s wedding', status: 'Pending', approvedBy: '' },
    { id: 'lv3', employeeName: 'Meena Iyer', type: 'SL', from: daysAgo(4), to: daysAgo(3), days: 2, reason: 'Fever', status: 'Approved', approvedBy: 'Rohit Singh' },
    { id: 'lv4', employeeName: 'Farhan Ali', type: 'Comp Off', from: daysAhead(3), to: daysAhead(3), days: 1, reason: 'Worked weekend for client presentation', status: 'Pending', approvedBy: '' },
    { id: 'lv5', employeeName: 'Manoj Tiwari', type: 'LWP', from: daysAgo(10), to: daysAgo(9), days: 2, reason: 'Village emergency', status: 'Approved', approvedBy: 'Rohit Singh' },
    { id: 'lv6', employeeName: 'Pooja Desai', type: 'EL', from: daysAhead(20), to: daysAhead(24), days: 5, reason: 'Vacation plan', status: 'Pending', approvedBy: '' },
  ]

  const payrolls = [
    { id: 'pr1', month: 'Jul 2026', employeeName: 'Amit Verma', basic: 105000, allowances: 70000, deductions: 21800, status: 'Paid', remarks: '' },
    { id: 'pr2', month: 'Jul 2026', employeeName: 'Vikas Yadav', basic: 27000, allowances: 18000, deductions: 4200, status: 'Paid', remarks: '' },
    { id: 'pr3', month: 'Jul 2026', employeeName: 'Sana Khan', basic: 57500, allowances: 38000, deductions: 12600, status: 'Paid', remarks: '' },
    { id: 'pr4', month: 'Aug 2026', employeeName: 'Amit Verma', basic: 105000, allowances: 70000, deductions: 21800, status: 'Processed', remarks: '' },
    { id: 'pr5', month: 'Aug 2026', employeeName: 'Vikas Yadav', basic: 27000, allowances: 18000, deductions: 4200, status: 'Processed', remarks: '+₹4,500 site overtime' },
    { id: 'pr6', month: 'Aug 2026', employeeName: 'Sana Khan', basic: 57500, allowances: 38000, deductions: 12600, status: 'Draft', remarks: '' },
    { id: 'pr7', month: 'Aug 2026', employeeName: 'Ramesh Kumar', basic: 26000, allowances: 17200, deductions: 3900, status: 'Draft', remarks: '' },
  ]

  const assets = [
    { id: 'as1', code: 'AST-EQ-001', name: 'Boom Lift 12m (Rented)', category: 'Equipment', projectId: P('p1'), purchaseDate: daysAgo(45), value: 235000, assignedTo: 'Vikas Yadav', condition: 'Good', status: 'In Use', remarks: 'Rental — return by month end.' },
    { id: 'as2', code: 'AST-EQ-002', name: 'Laser Level Kit', category: 'Tools', projectId: P('p1'), purchaseDate: daysAgo(300), value: 68000, assignedTo: 'Ramesh Kumar', condition: 'Good', status: 'In Use', remarks: '' },
    { id: 'as3', code: 'AST-VH-001', name: 'Tata Ace (Delivery)', category: 'Vehicle', projectId: '', purchaseDate: daysAgo(700), value: 780000, assignedTo: 'Sunil Patil', condition: 'Fair', status: 'In Use', remarks: 'MH-04-XX-2211' },
    { id: 'as4', code: 'AST-IT-001', name: 'HP DesignJet T650 Plotter', category: 'IT & Electronics', projectId: '', purchaseDate: daysAgo(420), value: 265000, assignedTo: 'Anjali Mehta', condition: 'Good', status: 'In Use', remarks: 'Design studio.' },
    { id: 'as5', code: 'AST-EQ-003', name: 'Concrete Mixer 10/7', category: 'Equipment', projectId: P('p8'), purchaseDate: daysAgo(500), value: 195000, assignedTo: 'Ramesh Kumar', condition: 'Fair', status: 'Idle', remarks: 'Free since site hold.' },
    { id: 'as6', code: 'AST-TL-004', name: 'Hilti SDS Drill Set (4)', category: 'Tools', projectId: P('p6'), purchaseDate: daysAgo(200), value: 96000, assignedTo: 'Vikas Yadav', condition: 'Good', status: 'In Use', remarks: '' },
    { id: 'as7', code: 'AST-SF-002', name: 'PPE Stock — Harnesses (12)', category: 'Safety', projectId: '', purchaseDate: daysAgo(150), value: 72000, assignedTo: 'Rohit Singh', condition: 'New', status: 'In Use', remarks: '' },
    { id: 'as8', code: 'AST-EQ-005', name: 'Plate Compactor', category: 'Equipment', projectId: P('p8'), purchaseDate: daysAgo(480), value: 88000, assignedTo: '', condition: 'Fair', status: 'Under Maintenance', remarks: 'Clutch plate replacement.' },
    { id: 'as9', code: 'AST-IT-002', name: 'MacBook Pro M3 — Design', category: 'IT & Electronics', projectId: '', purchaseDate: daysAgo(120), value: 245000, assignedTo: 'Anjali Mehta', condition: 'New', status: 'In Use', remarks: '' },
    { id: 'as10', code: 'AST-FN-003', name: 'Site Office Container (Nykaa)', category: 'Furniture', projectId: P('p4'), purchaseDate: daysAgo(140), value: 145000, assignedTo: 'Ramesh Kumar', condition: 'Good', status: 'In Use', remarks: '' },
  ]

  const documents = [
    { id: 'dc1', name: 'TCS Powai — Work Contract Signed', category: 'Contract', projectId: P('p1'), uploadedBy: 'Kavita Joshi', date: daysAgo(180), expiryDate: '', tags: 'tcs, main-contract' },
    { id: 'dc2', name: 'Godrej BKC — PO & Annexures', category: 'Contract', projectId: P('p2'), uploadedBy: 'Kavita Joshi', date: daysAgo(90), expiryDate: '', tags: 'godrej, po' },
    { id: 'dc3', name: 'GST Return — GSTR-3B (Jul)', category: 'Tax', projectId: '', uploadedBy: 'Meena Iyer', date: daysAgo(18), expiryDate: '', tags: 'gst, monthly' },
    { id: 'dc4', name: 'Fire NOC — TCS Powai (interim)', category: 'Compliance', projectId: P('p1'), uploadedBy: 'Arjun Reddy', date: daysAgo(30), expiryDate: daysAhead(60), tags: 'fire, noc' },
    { id: 'dc5', name: 'Employee ESIC Monthly Return', category: 'Compliance', projectId: '', uploadedBy: 'Pooja Desai', date: daysAgo(16), expiryDate: '', tags: 'esic, hr' },
    { id: 'dc6', name: 'Nykaa Store — Insurance Certificate', category: 'Insurance', projectId: P('p4'), uploadedBy: 'Kavita Joshi', date: daysAgo(140), expiryDate: daysAhead(20), tags: 'insurance, store' },
    { id: 'dc7', name: 'Alibaug Villa — Client Variation Order #2', category: 'Agreement', projectId: P('p3'), uploadedBy: 'Amit Verma', date: daysAgo(25), expiryDate: '', tags: 'variation, signed' },
    { id: 'dc8', name: 'Infosys Hinjawandi — Handover Certificate (Demolition)', category: 'Certificate', projectId: P('p6'), uploadedBy: 'Sandeep Rao', date: daysAgo(50), expiryDate: '', tags: 'infosys' },
    { id: 'dc9', name: 'Shop & Establishment License (Renewal)', category: 'Compliance', projectId: '', uploadedBy: 'Pooja Desai', date: daysAgo(200), expiryDate: daysAhead(45), tags: 'license, ho' },
    { id: 'dc10', name: 'Lodha Amara — Final Completion Certificate', category: 'Certificate', projectId: P('p7'), uploadedBy: 'Sandeep Rao', date: daysAgo(15), expiryDate: '', tags: 'lodha, completion' },
  ]

  const audit = [
    { id: uid('au'), ts: new Date(Date.now() - 36e5).toISOString(), user: 'Sana Khan', role: 'procurement', action: 'Create', module: 'Purchase Orders', title: 'PO-26-045' },
    { id: uid('au'), ts: new Date(Date.now() - 72e5).toISOString(), user: 'Vikas Yadav', role: 'site', action: 'Create', module: 'Site Progress (DPR)', title: 'TCS Powai — daily report' },
    { id: uid('au'), ts: new Date(Date.now() - 108e5).toISOString(), user: 'Kavita Joshi', role: 'accounts', action: 'Update', module: 'Invoices', title: 'AUR/26-27/038 → Partially Paid' },
    { id: uid('au'), ts: new Date(Date.now() - 144e5).toISOString(), user: 'Aakash Jain', role: 'admin', action: 'Settings', module: 'System', title: 'Enabled Safety module for Site Engineer role' },
    { id: uid('au'), ts: new Date(Date.now() - 180e5).toISOString(), user: 'Neha Gupta', role: 'sales', action: 'Create', module: 'Quotations', title: 'AUR-Q-2026-019' },
  ]

  return {
    users, employees, clients, projects, leads, quotations, vendors, materialRequests,
    purchaseOrders, grns, materials, stockTxns, budgetHeads, subcontractors, drawings,
    tasks, dailyLogs, qualityChecks, safetyIncidents, invoices, expenses, payments,
    attendance, leaves, payrolls, assets, documents, audit,
    meta: {
      company: { name: 'AURA Interiors & Fitout Pvt. Ltd.', short: 'AURA', currency: '₹', fyStart: 'April' },
      accent: '#4f46e5',
      session: null,
      enabledModules: MODULES.map((m) => m.id),
      permissions: buildDefaultPermissions(),
    },
  }
}
