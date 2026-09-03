/**
 * Placeholder activity, so the History page can be built and reviewed before
 * the API exists. Replace with a fetch from `GET /api/activity` — the page
 * reads exactly these fields and nothing else.
 *
 * `credits` is a delta: negative when credits are spent, positive when granted.
 */
const history = [
  {
    id: "h-231",
    at: "2026-09-03T09:12:00",
    kind: "Signed in",
    title: "Signed in with Google",
    detail: "Chrome on Windows",
    credits: 0,
  },
  {
    id: "h-230",
    at: "2026-09-02T18:40:00",
    kind: "Notes generated",
    title: "Deadlocks: conditions, prevention and the banker's algorithm",
    detail: "Operating Systems, from 18 pages of slides",
    credits: -6,
  },
  {
    id: "h-229",
    at: "2026-09-02T18:44:00",
    kind: "PDF exported",
    title: "Downloaded the deadlocks notes as a PDF",
    detail: "6 pages, ready to print",
    credits: -1,
  },
  {
    id: "h-228",
    at: "2026-09-02T11:05:00",
    kind: "Notes generated",
    title: "Normalisation up to BCNF, with the anomalies each form removes",
    detail: "DBMS, from pasted text",
    credits: -7,
  },
  {
    id: "h-227",
    at: "2026-09-02T10:58:00",
    kind: "Credits purchased",
    title: "Bought the 250-credit pack",
    detail: "Payment confirmed",
    credits: 250,
  },
  {
    id: "h-226",
    at: "2026-09-01T21:15:00",
    kind: "Notes generated",
    title: "Entropy and the second law: statements, and why they agree",
    detail: "Thermodynamics, from an uploaded PDF",
    credits: -3,
  },
  {
    id: "h-225",
    at: "2026-09-01T20:52:00",
    kind: "Note deleted",
    title: "Deleted an unfinished summary",
    detail: "Thermodynamics, generated twice by mistake",
    credits: 0,
  },
  {
    id: "h-224",
    at: "2026-08-31T16:30:00",
    kind: "Diagram created",
    title: "TCP three-way handshake and connection teardown",
    detail: "Computer Networks, sequence diagram",
    credits: -4,
  },
  {
    id: "h-223",
    at: "2026-08-31T16:12:00",
    kind: "Notes generated",
    title: "Transport layer: TCP against UDP",
    detail: "Computer Networks, from Unit 3 notes",
    credits: -5,
  },
  {
    id: "h-222",
    at: "2026-08-31T15:40:00",
    kind: "Signed in",
    title: "Signed in with Google",
    detail: "Chrome on Android",
    credits: 0,
  },
  {
    id: "h-221",
    at: "2026-08-30T09:50:00",
    kind: "Notes generated",
    title: "SN1 and SN2: what decides which mechanism runs",
    detail: "Organic Chemistry, from a handout",
    credits: -5,
  },
  {
    id: "h-220",
    at: "2026-08-30T09:31:00",
    kind: "PDF exported",
    title: "Downloaded the AVL rotations notes as a PDF",
    detail: "9 pages, ready to print",
    credits: -1,
  },
];

export default history;
