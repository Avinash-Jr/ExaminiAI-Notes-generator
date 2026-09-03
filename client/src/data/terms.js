/**
 * Terms of Service content.
 *
 * Drafted as clear, product-accurate starting copy — not reviewed by a lawyer.
 * Have counsel check clauses 4, 6, 7 and 11 (credits, AI output, academic
 * honesty, liability) before you publish, and set the real governing law.
 *
 * `body` entries: a string is a paragraph, an array is a bullet list.
 */
const terms = {
  title: "Terms of Service",
  standfirst:
    "The agreement between you and ExaminAI when you use the app to turn study material into notes. Written to be read, not skimmed past.",
  effective: "3 September 2026",
  version: "1.0",
  contactEmail: "support@examinai.app",
  sections: [
    {
      id: "what-examinai-does",
      heading: "What ExaminAI does",
      body: [
        "ExaminAI takes study material you give it — notes, chapters, slides, pasted text — and generates exam-focused notes, summaries and diagrams from it. You spend credits each time you generate something.",
        "These terms cover the ExaminAI website and app. By signing in you accept them. If you do not accept them, do not sign in.",
      ],
    },
    {
      id: "who-can-use-it",
      heading: "Who can use ExaminAI",
      body: [
        "You need to be at least 13 years old. If you are under 18, you need permission from a parent or guardian, and they accept these terms with you.",
        "One account per person. The details you give at sign-up need to be your own and accurate.",
      ],
    },
    {
      id: "your-account",
      heading: "Your account",
      body: [
        "You sign in through Google. Keeping that Google account secure keeps your ExaminAI account secure, so protect it accordingly.",
        "You are responsible for what happens under your account. Tell us at the address in clause 14 as soon as you think someone else has access to it.",
      ],
    },
    {
      id: "credits",
      heading: "Credits",
      body: [
        "New accounts start with 100 free credits. Generating notes, diagrams or PDFs spends credits, and the cost of each action is shown before you confirm it.",
        "Credits buy processing, not a result. Once a generation runs, its credits are spent even if you dislike the output. If a generation fails because of a fault on our side, we return the credits.",
        "Credits belong to your account. They cannot be transferred, resold or exchanged for cash. Purchased credits do not expire while your account is open.",
      ],
    },
    {
      id: "your-material",
      heading: "The material you upload",
      body: [
        "Your study material stays yours. Uploading it gives us permission to store and process it for one purpose: producing the notes you asked for, and keeping them in your history so you can find them again.",
        "Only upload material you are allowed to upload. Do not upload:",
        [
          "textbooks, question papers or course packs you do not have the right to copy",
          "other people's personal information",
          "anything unlawful, or anything you were told to keep confidential",
        ],
      ],
    },
    {
      id: "generated-notes",
      heading: "The notes ExaminAI generates",
      body: [
        "Notes generated from your material are yours to study from, print and share as you like.",
        "AI gets things wrong. It can misread a diagram, drop a step, or state something confidently that is simply false. Treat every generated note as a study aid to check against your syllabus, textbook and teacher — never as the authority on what is correct.",
        "ExaminAI does not promise any particular grade or exam outcome.",
      ],
    },
    {
      id: "academic-honesty",
      heading: "Academic honesty",
      body: [
        "Your school, college or university sets the rules about AI assistance, and those rules apply to you, not to us. Check them before you submit anything.",
        "Do not present generated text as your own original work where that is not allowed. Using ExaminAI to revise is very different from using it to cheat, and the second one is on you.",
      ],
    },
    {
      id: "what-you-may-not-do",
      heading: "What you may not do",
      body: [
        [
          "share your account, or sell access to it",
          "resell generated notes as a product or service",
          "scrape the app, or automate it outside features we provide",
          "try to get around credit limits, rate limits or payment",
          "reverse engineer the app, or probe it for vulnerabilities without written permission",
          "use ExaminAI to produce material that harasses, defrauds or harms anyone",
        ],
      ],
    },
    {
      id: "availability",
      heading: "Availability and changes to the app",
      body: [
        "ExaminAI is a product under active development. Features get added, changed and occasionally removed, and the app is sometimes down for maintenance or because something broke.",
        "If we retire a feature you depend on, we will say so in the app before it goes.",
      ],
    },
    {
      id: "ending-your-account",
      heading: "Suspending or ending an account",
      body: [
        "You can delete your account at any time from your profile. Deleting it removes your notes and history, so export anything you want to keep first.",
        "We may suspend or close an account that breaks these terms, abuses the service, or puts other users at risk. Where the situation allows it, we tell you first and give you a chance to put it right. Unused credits on an account we close for a breach are not refunded.",
      ],
    },
    {
      id: "liability",
      heading: "Limits on our liability",
      body: [
        "ExaminAI is provided as it is, without any warranty that it will be uninterrupted, error-free, or right about your subject.",
        "We are not liable for exam results, missed deadlines, lost data you did not export, or decisions you made based on generated notes. Where liability cannot be excluded by law, it is limited to the amount you paid us in the twelve months before the claim.",
      ],
    },
    {
      id: "changes-to-terms",
      heading: "Changes to these terms",
      body: [
        "When these terms change, the version number and effective date at the top of this page change with them, and we tell you in the app before the new version takes effect.",
        "Continuing to use ExaminAI after that date means you accept the new version. If you do not, delete your account.",
      ],
    },
    {
      id: "governing-law",
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of India, and the courts of Bengaluru, Karnataka have exclusive jurisdiction over any dispute arising from them.",
        "Before starting a formal dispute, write to us. Most problems turn out to be fixable by email.",
      ],
    },
    {
      id: "contact",
      heading: "How to reach us",
      body: [
        "Questions about these terms, or anything in them you think is unfair, go to support@examinai.app. We read every message.",
      ],
    },
  ],
};

export default terms;
