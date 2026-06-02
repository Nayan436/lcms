import { db } from './database'
import { subDays, addDays, subHours, setHours, setMinutes } from 'date-fns'

const now = new Date()

export async function seedDemoData() {
  // ── CLIENTS ──────────────────────────────────────────────────────────────
  const clientIds = await db.clients.bulkAdd([
    { name: 'Rajesh Patel', mobile: '9876543210', email: 'rajesh.patel@gmail.com', address: 'B-12, Satellite, Ahmedabad', notes: 'Referred by Amit Shah', createdAt: subDays(now, 120), updatedAt: subDays(now, 5) },
    { name: 'Priya Jain', mobile: '9823456789', email: 'priya.jain@yahoo.com', address: '45, Navrangpura, Ahmedabad', notes: 'Sensitive custody matter', createdAt: subDays(now, 90), updatedAt: subDays(now, 2) },
    { name: 'Amit Shah', mobile: '9812345678', email: 'amit.shah@outlook.com', address: 'C-5, Vastrapur, Ahmedabad', notes: 'Bail matter – urgent', createdAt: subDays(now, 60), updatedAt: subDays(now, 1) },
    { name: 'Sunita Mehta', mobile: '9834567890', email: 'sunita.mehta@gmail.com', address: '78, Maninagar, Ahmedabad', notes: 'Domestic violence case', createdAt: subDays(now, 80), updatedAt: subDays(now, 10) },
    { name: 'Vinod Kumar', mobile: '9845678901', email: 'vinod.kumar@gmail.com', address: '12, Paldi, Ahmedabad', notes: 'Criminal trial – 498A', createdAt: subDays(now, 45), updatedAt: subDays(now, 7) },
    { name: 'Kavya Sharma', mobile: '9856789012', email: 'kavya.sharma@gmail.com', address: '34, Bodakdev, Ahmedabad', notes: 'Maintenance matter', createdAt: subDays(now, 30), updatedAt: subDays(now, 3) },
    { name: 'Deepak Trivedi', mobile: '9867890123', email: 'deepak.trivedi@hotmail.com', address: '56, Chandkheda, Ahmedabad', notes: 'Anticipatory bail', createdAt: subDays(now, 15), updatedAt: subDays(now, 1) },
    { name: 'Meena Desai', mobile: '9878901234', email: 'meena.desai@gmail.com', address: '90, Thaltej, Ahmedabad', notes: 'Mutual divorce – amicable', createdAt: subDays(now, 10), updatedAt: subDays(now, 2) },
    { name: 'Ravi Prajapati', mobile: '9889012345', email: 'ravi.prajapati@gmail.com', address: '23, New Ranip, Ahmedabad', notes: 'Appeal matter', createdAt: subDays(now, 7), updatedAt: subDays(now, 1) },
    { name: 'Nandita Vora', mobile: '9890123456', email: 'nandita.vora@gmail.com', address: '67, Ghatlodia, Ahmedabad', notes: 'New client', createdAt: subDays(now, 3), updatedAt: subDays(now, 0) },
  ], { allKeys: true }) as number[]

  // ── CASES ─────────────────────────────────────────────────────────────────
  const caseIds = await db.cases.bulkAdd([
    // Rajesh Patel – 3 cases
    { clientId: clientIds[0], title: 'Divorce Petition', caseNumber: 'HMP/0123/2024', caseType: 'Divorce', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Rekha Patel', status: 'Evidence', filingDate: subDays(now, 110), nextHearingDate: addDays(now, 1), fixedFee: 50000, createdAt: subDays(now, 110), updatedAt: subDays(now, 5) },
    { clientId: clientIds[0], title: 'Child Custody Application', caseNumber: 'HMP/0456/2024', caseType: 'Child Custody', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Rekha Patel', status: 'Arguments', filingDate: subDays(now, 80), nextHearingDate: addDays(now, 5), fixedFee: 30000, createdAt: subDays(now, 80), updatedAt: subDays(now, 3) },
    { clientId: clientIds[0], title: 'Maintenance Application', caseNumber: 'MC/0789/2024', caseType: 'Maintenance', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Rekha Patel', status: 'Filed', filingDate: subDays(now, 40), nextHearingDate: addDays(now, 12), fixedFee: 20000, createdAt: subDays(now, 40), updatedAt: subDays(now, 2) },

    // Priya Jain – 2 cases
    { clientId: clientIds[1], title: 'Custody Matter', caseNumber: 'HMP/0321/2024', caseType: 'Child Custody', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Sanjay Jain', status: 'Evidence', filingDate: subDays(now, 85), nextHearingDate: addDays(now, 3), fixedFee: 45000, createdAt: subDays(now, 85), updatedAt: subDays(now, 2) },
    { clientId: clientIds[1], title: 'Domestic Violence Complaint', caseNumber: 'DV/0654/2024', caseType: 'Domestic Violence', courtName: 'MM Court, Ahmedabad', oppositeParty: 'Sanjay Jain', status: 'Notice Issued', filingDate: subDays(now, 55), nextHearingDate: addDays(now, 8), fixedFee: 25000, createdAt: subDays(now, 55), updatedAt: subDays(now, 4) },

    // Amit Shah – 1 case
    { clientId: clientIds[2], title: 'Bail Application', caseNumber: 'BA/0987/2024', caseType: 'Bail', courtName: 'Sessions Court, Ahmedabad', oppositeParty: 'State of Gujarat', status: 'Arguments', filingDate: subDays(now, 55), nextHearingDate: now, fixedFee: 35000, createdAt: subDays(now, 55), updatedAt: subDays(now, 1) },

    // Sunita Mehta – 1 case
    { clientId: clientIds[3], title: 'DV Protection Order', caseNumber: 'DV/0147/2024', caseType: 'Domestic Violence', courtName: 'MM Court, Ahmedabad', oppositeParty: 'Mahesh Mehta', status: 'Filed', filingDate: subDays(now, 75), nextHearingDate: addDays(now, 6), fixedFee: 28000, createdAt: subDays(now, 75), updatedAt: subDays(now, 6) },

    // Vinod Kumar – 2 cases
    { clientId: clientIds[4], title: '498A Criminal Trial', caseNumber: 'SC/0258/2024', caseType: '498A', courtName: 'Sessions Court, Ahmedabad', oppositeParty: 'State of Gujarat', status: 'Evidence', filingDate: subDays(now, 40), nextHearingDate: addDays(now, 9), fixedFee: 60000, createdAt: subDays(now, 40), updatedAt: subDays(now, 3) },
    { clientId: clientIds[4], title: 'Anticipatory Bail', caseNumber: 'AB/0369/2024', caseType: 'Anticipatory Bail', courtName: 'HC, Gujarat', oppositeParty: 'State of Gujarat', status: 'Arguments', filingDate: subDays(now, 20), nextHearingDate: addDays(now, 2), fixedFee: 40000, createdAt: subDays(now, 20), updatedAt: subDays(now, 1) },

    // Kavya Sharma – 1 case
    { clientId: clientIds[5], title: 'Maintenance Petition', caseNumber: 'MC/0741/2024', caseType: 'Maintenance', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Kiran Sharma', status: 'Notice Issued', filingDate: subDays(now, 25), nextHearingDate: addDays(now, 14), fixedFee: 22000, createdAt: subDays(now, 25), updatedAt: subDays(now, 5) },

    // Deepak Trivedi – 1 case
    { clientId: clientIds[6], title: 'Anticipatory Bail Application', caseNumber: 'AB/0852/2024', caseType: 'Anticipatory Bail', courtName: 'Sessions Court, Ahmedabad', oppositeParty: 'State of Gujarat', status: 'Drafting', filingDate: subDays(now, 10), nextHearingDate: addDays(now, 4), fixedFee: 38000, createdAt: subDays(now, 10), updatedAt: subDays(now, 1) },

    // Meena Desai – 1 case
    { clientId: clientIds[7], title: 'Mutual Divorce Petition', caseNumber: 'HMP/0963/2024', caseType: 'Mutual Divorce', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Suresh Desai', status: 'Filed', filingDate: subDays(now, 8), nextHearingDate: addDays(now, 20), fixedFee: 18000, createdAt: subDays(now, 8), updatedAt: subDays(now, 2) },

    // Ravi Prajapati – 1 case
    { clientId: clientIds[8], title: 'Criminal Appeal', caseNumber: 'CA/0174/2024', caseType: 'Appeal', courtName: 'HC, Gujarat', oppositeParty: 'State of Gujarat', status: 'Arguments', filingDate: subDays(now, 6), nextHearingDate: addDays(now, 7), fixedFee: 55000, createdAt: subDays(now, 6), updatedAt: subDays(now, 1) },

    // Nandita Vora – 1 case
    { clientId: clientIds[9], title: 'Divorce Petition', caseNumber: 'HMP/1085/2024', caseType: 'Divorce', courtName: 'Family Court, Ahmedabad', oppositeParty: 'Prashant Vora', status: 'Drafting', filingDate: subDays(now, 2), nextHearingDate: addDays(now, 25), fixedFee: 42000, createdAt: subDays(now, 2), updatedAt: subDays(now, 0) },
  ], { allKeys: true }) as number[]

  // ── HEARINGS ──────────────────────────────────────────────────────────────
  const todayAt = (h: number, m = 0) => setMinutes(setHours(now, h), m)

  await db.hearings.bulkAdd([
    // Today's hearings
    { caseId: caseIds[5], clientId: clientIds[2], date: now, time: '10:30', courtNumber: 'Court 3', judgeName: 'Hon. K.R. Mehta', remarks: 'Arguments on bail', status: 'Scheduled', createdAt: subDays(now, 5), updatedAt: subDays(now, 1) },
    { caseId: caseIds[0], clientId: clientIds[0], date: now, time: '12:00', courtNumber: 'Court 7', judgeName: 'Hon. M.S. Patel', remarks: 'Evidence submission', status: 'Scheduled', createdAt: subDays(now, 10), updatedAt: subDays(now, 2) },
    { caseId: caseIds[3], clientId: clientIds[1], date: now, time: '15:00', courtNumber: 'Court 5', judgeName: 'Hon. A.K. Joshi', remarks: 'Custody hearing', status: 'Scheduled', createdAt: subDays(now, 8), updatedAt: subDays(now, 1) },

    // Upcoming hearings
    { caseId: caseIds[8], clientId: clientIds[4], date: addDays(now, 2), time: '11:00', courtNumber: 'Court 2', judgeName: 'Hon. S.N. Dave', remarks: 'AB arguments', status: 'Scheduled', createdAt: subDays(now, 5), updatedAt: subDays(now, 1) },
    { caseId: caseIds[3], clientId: clientIds[1], date: addDays(now, 3), time: '10:00', courtNumber: 'Court 5', judgeName: 'Hon. A.K. Joshi', remarks: 'Next date', status: 'Scheduled', createdAt: subDays(now, 3), updatedAt: subDays(now, 0) },
    { caseId: caseIds[10], clientId: clientIds[6], date: addDays(now, 4), time: '14:30', courtNumber: 'Court 1', judgeName: 'Hon. R.P. Singh', remarks: 'First hearing', status: 'Scheduled', createdAt: subDays(now, 2), updatedAt: subDays(now, 0) },
    { caseId: caseIds[1], clientId: clientIds[0], date: addDays(now, 5), time: '11:30', courtNumber: 'Court 7', judgeName: 'Hon. M.S. Patel', remarks: 'Custody arguments', status: 'Scheduled', createdAt: subDays(now, 4), updatedAt: subDays(now, 1) },
    { caseId: caseIds[6], clientId: clientIds[3], date: addDays(now, 6), time: '10:00', courtNumber: 'Court 4', judgeName: 'Hon. P.K. Rao', remarks: 'DV hearing', status: 'Scheduled', createdAt: subDays(now, 3), updatedAt: subDays(now, 0) },
    { caseId: caseIds[12], clientId: clientIds[8], date: addDays(now, 7), time: '14:00', courtNumber: 'HC Court 8', judgeName: 'Hon. D.N. Bhatt', remarks: 'Appeal arguments', status: 'Scheduled', createdAt: subDays(now, 2), updatedAt: subDays(now, 0) },

    // Past hearings
    { caseId: caseIds[0], clientId: clientIds[0], date: subDays(now, 15), time: '10:30', courtNumber: 'Court 7', judgeName: 'Hon. M.S. Patel', remarks: 'Income proof ordered', status: 'Completed', createdAt: subDays(now, 20), updatedAt: subDays(now, 15) },
    { caseId: caseIds[0], clientId: clientIds[0], date: subDays(now, 30), time: '10:00', courtNumber: 'Court 7', judgeName: 'Hon. M.S. Patel', remarks: 'Evidence list filed', status: 'Completed', createdAt: subDays(now, 35), updatedAt: subDays(now, 30) },
    { caseId: caseIds[3], clientId: clientIds[1], date: subDays(now, 20), time: '15:00', courtNumber: 'Court 5', judgeName: 'Hon. A.K. Joshi', remarks: 'Adjourned – opp. party absent', status: 'Adjourned', createdAt: subDays(now, 25), updatedAt: subDays(now, 20) },
    { caseId: caseIds[5], clientId: clientIds[2], date: subDays(now, 10), time: '11:00', courtNumber: 'Court 3', judgeName: 'Hon. K.R. Mehta', remarks: 'Bail denied – re-applying', status: 'Completed', createdAt: subDays(now, 12), updatedAt: subDays(now, 10) },
    { caseId: caseIds[7], clientId: clientIds[4], date: subDays(now, 7), time: '10:00', courtNumber: 'Court 2', judgeName: 'Hon. S.N. Dave', remarks: 'Witness examined', status: 'Completed', createdAt: subDays(now, 10), updatedAt: subDays(now, 7) },
    { caseId: caseIds[1], clientId: clientIds[0], date: subDays(now, 45), time: '11:00', courtNumber: 'Court 7', judgeName: 'Hon. M.S. Patel', remarks: 'Notice served', status: 'Completed', createdAt: subDays(now, 50), updatedAt: subDays(now, 45) },
    { caseId: caseIds[4], clientId: clientIds[1], date: subDays(now, 25), time: '14:00', courtNumber: 'Court 4', judgeName: 'Hon. P.K. Rao', remarks: 'Notice issued to opp. party', status: 'Completed', createdAt: subDays(now, 28), updatedAt: subDays(now, 25) },
    { caseId: caseIds[9], clientId: clientIds[5], date: subDays(now, 12), time: '10:30', courtNumber: 'Court 6', judgeName: 'Hon. L.K. Bhatt', remarks: 'Maintenance amount discussed', status: 'Completed', createdAt: subDays(now, 15), updatedAt: subDays(now, 12) },
    { caseId: caseIds[2], clientId: clientIds[0], date: subDays(now, 38), time: '14:00', courtNumber: 'Court 7', judgeName: 'Hon. M.S. Patel', remarks: 'First hearing', status: 'Completed', createdAt: subDays(now, 40), updatedAt: subDays(now, 38) },
    { caseId: caseIds[6], clientId: clientIds[3], date: subDays(now, 50), time: '11:00', courtNumber: 'Court 4', judgeName: 'Hon. P.K. Rao', remarks: 'Protection order granted', status: 'Completed', createdAt: subDays(now, 55), updatedAt: subDays(now, 50) },
    { caseId: caseIds[8], clientId: clientIds[4], date: subDays(now, 5), time: '10:00', courtNumber: 'Court 2', judgeName: 'Hon. S.N. Dave', remarks: 'AB – notice issued', status: 'Completed', createdAt: subDays(now, 8), updatedAt: subDays(now, 5) },
  ])

  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  await db.payments.bulkAdd([
    { caseId: caseIds[0], clientId: clientIds[0], amount: 20000, date: subDays(now, 100), paymentMode: 'Cash', remarks: 'Advance fees', createdAt: subDays(now, 100) },
    { caseId: caseIds[0], clientId: clientIds[0], amount: 10000, date: subDays(now, 60), paymentMode: 'UPI', remarks: 'Second installment', createdAt: subDays(now, 60) },
    { caseId: caseIds[1], clientId: clientIds[0], amount: 15000, date: subDays(now, 70), paymentMode: 'Bank Transfer', remarks: 'Custody case advance', createdAt: subDays(now, 70) },
    { caseId: caseIds[3], clientId: clientIds[1], amount: 25000, date: subDays(now, 80), paymentMode: 'Cash', remarks: 'Full advance', createdAt: subDays(now, 80) },
    { caseId: caseIds[5], clientId: clientIds[2], amount: 20000, date: subDays(now, 50), paymentMode: 'UPI', remarks: 'Bail case advance', createdAt: subDays(now, 50) },
    { caseId: caseIds[5], clientId: clientIds[2], amount: 10000, date: subDays(now, 20), paymentMode: 'Cash', remarks: 'Second payment', createdAt: subDays(now, 20) },
    { caseId: caseIds[7], clientId: clientIds[4], amount: 30000, date: subDays(now, 35), paymentMode: 'Cheque', remarks: 'Cheque no. 456789', createdAt: subDays(now, 35) },
    { caseId: caseIds[6], clientId: clientIds[3], amount: 15000, date: subDays(now, 70), paymentMode: 'UPI', remarks: 'DV case advance', createdAt: subDays(now, 70) },
    { caseId: caseIds[9], clientId: clientIds[5], amount: 10000, date: subDays(now, 25), paymentMode: 'Cash', remarks: 'Maintenance case advance', createdAt: subDays(now, 25) },
    { caseId: caseIds[11], clientId: clientIds[7], amount: 18000, date: subDays(now, 8), paymentMode: 'UPI', remarks: 'Full payment – mutual divorce', createdAt: subDays(now, 8) },
  ])

  // ── VARIABLE CHARGES ──────────────────────────────────────────────────────
  await db.variableCharges.bulkAdd([
    { caseId: caseIds[0], label: 'Court Fee', amount: 2000, date: subDays(now, 110), createdAt: subDays(now, 110) },
    { caseId: caseIds[0], label: 'Travel', amount: 500, date: subDays(now, 30), createdAt: subDays(now, 30) },
    { caseId: caseIds[0], label: 'Stamp Duty', amount: 1500, date: subDays(now, 80), createdAt: subDays(now, 80) },
    { caseId: caseIds[3], label: 'Court Fee', amount: 1000, date: subDays(now, 85), createdAt: subDays(now, 85) },
    { caseId: caseIds[5], label: 'Documentation', amount: 800, date: subDays(now, 55), createdAt: subDays(now, 55) },
    { caseId: caseIds[7], label: 'Court Fee', amount: 3000, date: subDays(now, 40), createdAt: subDays(now, 40) },
  ])

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  await db.documents.bulkAdd([
    { caseId: caseIds[0], clientId: clientIds[0], name: 'Marriage Certificate', category: 'Evidence', checked: true, createdAt: subDays(now, 100) },
    { caseId: caseIds[0], clientId: clientIds[0], name: 'Income Proof', category: 'Evidence', checked: false, createdAt: subDays(now, 15) },
    { caseId: caseIds[0], clientId: clientIds[0], name: 'Affidavit', category: 'Affidavit', checked: true, createdAt: subDays(now, 80) },
    { caseId: caseIds[3], clientId: clientIds[1], name: 'Birth Certificate of Child', category: 'Evidence', checked: true, createdAt: subDays(now, 85) },
    { caseId: caseIds[3], clientId: clientIds[1], name: 'School Records', category: 'Evidence', checked: false, createdAt: subDays(now, 20) },
    { caseId: caseIds[5], clientId: clientIds[2], name: 'FIR Copy', category: 'FIR', checked: true, createdAt: subDays(now, 55) },
    { caseId: caseIds[5], clientId: clientIds[2], name: 'Chargesheet', category: 'Chargesheet', checked: true, createdAt: subDays(now, 50) },
    { caseId: caseIds[7], clientId: clientIds[4], name: 'FIR Copy', category: 'FIR', checked: true, createdAt: subDays(now, 40) },
    { caseId: caseIds[7], clientId: clientIds[4], name: 'Chargesheet', category: 'Chargesheet', checked: false, createdAt: subDays(now, 10) },
    { caseId: caseIds[6], clientId: clientIds[3], name: 'Medical Report', category: 'Evidence', checked: true, createdAt: subDays(now, 75) },
    { caseId: caseIds[6], clientId: clientIds[3], name: 'Court Order', category: 'Court Order', checked: true, createdAt: subDays(now, 50) },
    { caseId: caseIds[1], clientId: clientIds[0], name: 'Child Custody Application', category: 'Other', checked: true, createdAt: subDays(now, 80) },
    { caseId: caseIds[8], clientId: clientIds[4], name: 'AB Application', category: 'Other', checked: true, createdAt: subDays(now, 20) },
    { caseId: caseIds[12], clientId: clientIds[8], name: 'Appeal Memo', category: 'Other', checked: true, createdAt: subDays(now, 6) },
    { caseId: caseIds[9], clientId: clientIds[5], name: 'Salary Certificate', category: 'Evidence', checked: false, createdAt: subDays(now, 5) },
  ])

  // ── NOTES ─────────────────────────────────────────────────────────────────
  await db.notes.bulkAdd([
    { caseId: caseIds[0], clientId: clientIds[0], content: 'Judge Patel has requested income proof from opposite party. Need to file affidavit by next hearing.', date: subDays(now, 15), createdAt: subDays(now, 15) },
    { caseId: caseIds[0], clientId: clientIds[0], content: 'Evidence list filed. 5 documents submitted. Opposite party objected to Exhibit 3.', date: subDays(now, 30), createdAt: subDays(now, 30) },
    { caseId: caseIds[3], clientId: clientIds[1], content: 'Opposite party did not appear. Judge gave strong warning. Next date fixed.', date: subDays(now, 20), createdAt: subDays(now, 20) },
    { caseId: caseIds[5], clientId: clientIds[2], content: 'Bail rejected on first attempt. Re-applying with stronger surety bonds. Client very anxious.', date: subDays(now, 10), createdAt: subDays(now, 10) },
    { caseId: caseIds[7], clientId: clientIds[4], content: 'Witness cross-examined successfully. Their statement supports our case. Next – documentary evidence.', date: subDays(now, 7), createdAt: subDays(now, 7) },
    { caseId: caseIds[1], clientId: clientIds[0], content: 'Custody of child currently with mother. Client wants weekday visits. Need to draft visitation schedule.', date: subDays(now, 45), createdAt: subDays(now, 45) },
    { caseId: caseIds[4], clientId: clientIds[1], content: 'Protection order needs renewal next month. Client confirmed safety at current location.', date: subDays(now, 25), createdAt: subDays(now, 25) },
  ])

  // ── TIMELINE ──────────────────────────────────────────────────────────────
  await db.timeline.bulkAdd([
    { caseId: caseIds[0], clientId: clientIds[0], type: 'note', title: 'Note Added', description: 'Judge requested income proof from opp. party', date: subDays(now, 15), createdAt: subDays(now, 15) },
    { caseId: caseIds[0], clientId: clientIds[0], type: 'hearing', title: 'Hearing Completed', description: 'Evidence list filed', date: subDays(now, 30), createdAt: subDays(now, 30) },
    { caseId: caseIds[0], clientId: clientIds[0], type: 'payment', title: 'Payment Received', description: '₹10,000 via UPI', date: subDays(now, 60), createdAt: subDays(now, 60) },
    { caseId: caseIds[0], clientId: clientIds[0], type: 'status_change', title: 'Status Updated', description: 'Filed → Evidence', date: subDays(now, 90), createdAt: subDays(now, 90) },
    { caseId: caseIds[0], clientId: clientIds[0], type: 'document', title: 'Document Added', description: 'Affidavit uploaded', date: subDays(now, 80), createdAt: subDays(now, 80) },
    { caseId: caseIds[0], clientId: clientIds[0], type: 'payment', title: 'Payment Received', description: '₹20,000 advance', date: subDays(now, 100), createdAt: subDays(now, 100) },
    { caseId: caseIds[0], clientId: clientIds[0], type: 'note', title: 'Case Created', description: 'Divorce petition filed', date: subDays(now, 110), createdAt: subDays(now, 110) },

    { caseId: caseIds[3], clientId: clientIds[1], type: 'hearing', title: 'Hearing Adjourned', description: 'Opp. party absent', date: subDays(now, 20), createdAt: subDays(now, 20) },
    { caseId: caseIds[3], clientId: clientIds[1], type: 'payment', title: 'Payment Received', description: '₹25,000 advance', date: subDays(now, 80), createdAt: subDays(now, 80) },
    { caseId: caseIds[3], clientId: clientIds[1], type: 'note', title: 'Case Created', description: 'Custody matter filed', date: subDays(now, 85), createdAt: subDays(now, 85) },

    { caseId: caseIds[5], clientId: clientIds[2], type: 'hearing', title: 'Bail Rejected', description: 'Re-applying with stronger surety', date: subDays(now, 10), createdAt: subDays(now, 10) },
    { caseId: caseIds[5], clientId: clientIds[2], type: 'payment', title: 'Payment Received', description: '₹10,000 second payment', date: subDays(now, 20), createdAt: subDays(now, 20) },
    { caseId: caseIds[5], clientId: clientIds[2], type: 'note', title: 'Case Created', description: 'Bail application filed', date: subDays(now, 55), createdAt: subDays(now, 55) },

    { caseId: caseIds[7], clientId: clientIds[4], type: 'hearing', title: 'Witness Examined', description: 'Cross-examination successful', date: subDays(now, 7), createdAt: subDays(now, 7) },
    { caseId: caseIds[7], clientId: clientIds[4], type: 'payment', title: 'Payment Received', description: '₹30,000 via cheque', date: subDays(now, 35), createdAt: subDays(now, 35) },

    { caseId: caseIds[6], clientId: clientIds[3], type: 'hearing', title: 'Protection Order Granted', description: 'Interim protection order in favour of client', date: subDays(now, 50), createdAt: subDays(now, 50) },
    { caseId: caseIds[6], clientId: clientIds[3], type: 'document', title: 'Medical Report Filed', description: 'Medical report submitted as evidence', date: subDays(now, 75), createdAt: subDays(now, 75) },

    { caseId: caseIds[1], clientId: clientIds[0], type: 'hearing', title: 'Notice Served', description: 'Opposite party served notice', date: subDays(now, 45), createdAt: subDays(now, 45) },
    { caseId: caseIds[4], clientId: clientIds[1], type: 'hearing', title: 'Notice Issued', description: 'Notice sent to opposite party', date: subDays(now, 25), createdAt: subDays(now, 25) },
    { caseId: caseIds[8], clientId: clientIds[4], type: 'hearing', title: 'AB Notice Issued', description: 'Notice issued in anticipatory bail', date: subDays(now, 5), createdAt: subDays(now, 5) },
    { caseId: caseIds[9], clientId: clientIds[5], type: 'note', title: 'Case Created', description: 'Maintenance petition filed', date: subDays(now, 25), createdAt: subDays(now, 25) },
    { caseId: caseIds[10], clientId: clientIds[6], type: 'note', title: 'Case Created', description: 'Anticipatory bail application drafted', date: subDays(now, 10), createdAt: subDays(now, 10) },
    { caseId: caseIds[11], clientId: clientIds[7], type: 'payment', title: 'Full Payment Received', description: '₹18,000 via UPI', date: subDays(now, 8), createdAt: subDays(now, 8) },
    { caseId: caseIds[12], clientId: clientIds[8], type: 'note', title: 'Case Created', description: 'Criminal appeal filed in HC', date: subDays(now, 6), createdAt: subDays(now, 6) },
    { caseId: caseIds[13], clientId: clientIds[9], type: 'note', title: 'Case Created', description: 'Divorce petition drafted', date: subDays(now, 2), createdAt: subDays(now, 2) },
    { caseId: caseIds[2], clientId: clientIds[0], type: 'hearing', title: 'First Hearing', description: 'Maintenance application – first date', date: subDays(now, 38), createdAt: subDays(now, 38) },
    { caseId: caseIds[2], clientId: clientIds[0], type: 'payment', title: 'Case Created', description: 'Maintenance case opened', date: subDays(now, 40), createdAt: subDays(now, 40) },
    { caseId: caseIds[9], clientId: clientIds[5], type: 'hearing', title: 'Maintenance Discussed', description: 'Amount negotiation ongoing', date: subDays(now, 12), createdAt: subDays(now, 12) },
    { caseId: caseIds[2], clientId: clientIds[0], type: 'payment', title: 'Maintenance Advance', description: '₹5,000 advance for maintenance case', date: subDays(now, 38), createdAt: subDays(now, 38) },
    { caseId: caseIds[13], clientId: clientIds[9], type: 'communication', title: 'Client Meeting', description: 'Initial consultation – documents collected', date: subDays(now, 3), createdAt: subDays(now, 3) },
  ])

  // ── TASKS ─────────────────────────────────────────────────────────────────
  await db.tasks.bulkAdd([
    { caseId: caseIds[0], clientId: clientIds[0], title: 'Collect Income Proof from Client', description: 'Judge has requested income proof', priority: 'Urgent', status: 'Pending', dueDate: addDays(now, 1), createdAt: subDays(now, 5), updatedAt: subDays(now, 5) },
    { caseId: caseIds[3], clientId: clientIds[1], title: 'Draft Visitation Schedule', description: 'Prepare proposed visitation schedule for custody case', priority: 'High', status: 'Pending', dueDate: addDays(now, 3), createdAt: subDays(now, 2), updatedAt: subDays(now, 2) },
    { caseId: caseIds[5], clientId: clientIds[2], title: 'Arrange Surety Bonds', description: 'Need 2 strong sureties for bail re-application', priority: 'Urgent', status: 'In Progress', dueDate: now, createdAt: subDays(now, 3), updatedAt: subDays(now, 1) },
    { caseId: caseIds[7], clientId: clientIds[4], title: 'File Documentary Evidence', description: 'Submit documentary evidence in 498A case', priority: 'High', status: 'Pending', dueDate: addDays(now, 9), createdAt: subDays(now, 2), updatedAt: subDays(now, 2) },
    { caseId: caseIds[10], clientId: clientIds[6], title: 'Draft AB Application', description: 'Complete drafting of anticipatory bail application', priority: 'High', status: 'In Progress', dueDate: addDays(now, 2), createdAt: subDays(now, 1), updatedAt: subDays(now, 1) },
    { clientId: clientIds[0], title: 'Payment Follow-up: Rajesh Patel', description: '₹20,000 pending from Rajesh Patel', priority: 'Medium', status: 'Pending', dueDate: addDays(now, 5), createdAt: subDays(now, 2), updatedAt: subDays(now, 2) },
    { clientId: clientIds[1], title: 'Payment Follow-up: Priya Jain', description: '₹20,000 pending from Priya Jain', priority: 'Medium', status: 'Pending', dueDate: addDays(now, 7), createdAt: subDays(now, 1), updatedAt: subDays(now, 1) },
  ])

  // ── COMMUNICATIONS ────────────────────────────────────────────────────────
  await db.communications.bulkAdd([
    { caseId: caseIds[0], clientId: clientIds[0], type: 'Call', content: 'Client called – requested status update on divorce petition. Informed about next hearing date.', date: subDays(now, 3), createdAt: subDays(now, 3) },
    { caseId: caseIds[3], clientId: clientIds[1], type: 'WhatsApp', content: 'Sent hearing schedule to client via WhatsApp. Client confirmed attendance.', date: subDays(now, 2), createdAt: subDays(now, 2) },
    { caseId: caseIds[5], clientId: clientIds[2], type: 'Meeting', content: 'Meeting at office – discussed bail strategy and surety arrangements.', date: subDays(now, 5), createdAt: subDays(now, 5) },
    { caseId: caseIds[7], clientId: clientIds[4], type: 'Call', content: 'Called client with witness cross-examination update. Positive outcome.', date: subDays(now, 7), createdAt: subDays(now, 7) },
    { caseId: caseIds[1], clientId: clientIds[0], type: 'WhatsApp', content: 'Client shared school records for custody case. Will file next week.', date: subDays(now, 4), createdAt: subDays(now, 4) },
    { clientId: clientIds[9], type: 'Meeting', content: 'Initial consultation – discussed grounds for divorce, collected documents.', date: subDays(now, 3), createdAt: subDays(now, 3) },
  ])

  // ── REMINDERS ─────────────────────────────────────────────────────────────
  // Reminders will be created dynamically by the reminder system

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  await db.settings.bulkAdd([
    { key: 'lawyerName', value: 'Adv. Prakash Mehta' },
    { key: 'lawyerPhone', value: '9900112233' },
    { key: 'lawyerEmail', value: 'adv.prakash@mehtalaw.in' },
    { key: 'officeName', value: 'Mehta & Associates' },
    { key: 'officeAddress', value: '302, Law Chambers, CG Road, Ahmedabad – 380009' },
    { key: 'barCouncilNo', value: 'GJ/5432/2010' },
    { key: 'notificationsEnabled', value: 'true' },
    { key: 'reminderDayBefore', value: 'true' },
    { key: 'reminderSameDay', value: 'true' },
    { key: 'reminderOneHour', value: 'true' },
    { key: 'demoDataSeeded', value: 'true' },
  ])
}
