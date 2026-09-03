/**
 * Placeholder notes, so the Notes page can be built and reviewed before the
 * API exists. Replace with a fetch from `GET /api/notes` — the page reads
 * exactly these fields and nothing else.
 */
const notes = [
  {
    id: "n-114",
    title: "Deadlocks: conditions, prevention and the banker's algorithm",
    subject: "Operating Systems",
    kind: "Exam notes",
    createdAt: "2026-09-02T18:40:00",
    words: 1840,
    credits: 6,
    source: "Unit 4 lecture slides (18 pages)",
    excerpt:
      "Four Coffman conditions must hold at once for a deadlock, so breaking any one of them prevents it. The banker's algorithm avoids deadlock by refusing any allocation that leaves no safe sequence.",
    starred: true,
  },
  {
    id: "n-113",
    title: "Normalisation up to BCNF, with the anomalies each form removes",
    subject: "DBMS",
    kind: "Exam notes",
    createdAt: "2026-09-02T11:05:00",
    words: 2130,
    credits: 7,
    source: "Chapter 7, pasted text",
    excerpt:
      "Each normal form removes a specific class of anomaly: 1NF removes repeating groups, 2NF partial dependencies, 3NF transitive dependencies, BCNF the remaining determinant that is not a candidate key.",
    starred: false,
  },
  {
    id: "n-112",
    title: "Entropy and the second law: statements, and why they agree",
    subject: "Thermodynamics",
    kind: "Summary",
    createdAt: "2026-09-01T21:15:00",
    words: 960,
    credits: 3,
    source: "Two chapters, uploaded PDF",
    excerpt:
      "Kelvin-Planck and Clausius look like different statements about engines and refrigerators, but violating one constructs a machine that violates the other, so they are equivalent.",
    starred: false,
  },
  {
    id: "n-111",
    title: "TCP three-way handshake and connection teardown",
    subject: "Computer Networks",
    kind: "Diagram",
    createdAt: "2026-08-31T16:30:00",
    words: 340,
    credits: 4,
    source: "Unit 3 notes",
    excerpt:
      "Sequence diagram of SYN, SYN-ACK and ACK, then the four-step FIN teardown with the TIME_WAIT state marked and explained.",
    starred: true,
  },
  {
    id: "n-110",
    title: "SN1 and SN2: what decides which mechanism runs",
    subject: "Organic Chemistry",
    kind: "Exam notes",
    createdAt: "2026-08-30T09:50:00",
    words: 1520,
    credits: 5,
    source: "Reaction mechanisms handout",
    excerpt:
      "Substrate structure decides most of it: tertiary carbons favour SN1 through a stable carbocation, primary carbons favour SN2 because the backside attack is unhindered. Solvent and nucleophile strength decide the rest.",
    starred: false,
  },
  {
    id: "n-109",
    title: "Balanced trees: AVL rotations worked through case by case",
    subject: "Data Structures",
    kind: "Exam notes",
    createdAt: "2026-08-29T14:20:00",
    words: 2260,
    credits: 8,
    source: "Lab manual and lecture notes",
    excerpt:
      "Left-left and right-right imbalances need one rotation; left-right and right-left need two. Each of the four cases is worked through with the balance factors before and after.",
    starred: false,
  },
  {
    id: "n-108",
    title: "Elasticity of demand, and when revenue moves against price",
    subject: "Microeconomics",
    kind: "Summary",
    createdAt: "2026-08-28T19:05:00",
    words: 780,
    credits: 3,
    source: "Tutorial sheet 5",
    excerpt:
      "Where demand is elastic, a price rise loses more volume than it gains in margin and revenue falls. The sign of that relationship flips exactly at unit elasticity.",
    starred: false,
  },
  {
    id: "n-107",
    title: "Library management system: project documentation",
    subject: "Data Structures",
    kind: "Project doc",
    createdAt: "2026-08-27T22:40:00",
    words: 3120,
    credits: 10,
    source: "Source files and schema",
    excerpt:
      "Problem statement, module breakdown, ER diagram, API table and test plan, formatted for submission.",
    starred: true,
  },
  {
    id: "n-106",
    title: "Cardiac cycle: phases, valve states and pressure curves",
    subject: "Human Anatomy",
    kind: "Diagram",
    createdAt: "2026-08-26T08:15:00",
    words: 410,
    credits: 4,
    source: "Chapter 12 figures",
    excerpt:
      "Pressure-volume loop annotated with each valve opening and closing, aligned against the phases of systole and diastole.",
    starred: false,
  },
  {
    id: "n-105",
    title: "Paging versus segmentation, and why most systems use both",
    subject: "Operating Systems",
    kind: "Summary",
    createdAt: "2026-08-24T13:00:00",
    words: 890,
    credits: 3,
    source: "Unit 3 slides",
    excerpt:
      "Paging solves external fragmentation but ignores program structure; segmentation respects structure but fragments memory. Segmented paging takes the useful half of each.",
    starred: false,
  },
];

export default notes;
