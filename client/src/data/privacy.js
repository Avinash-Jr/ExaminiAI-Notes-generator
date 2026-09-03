/**
 * Privacy Policy content.
 *
 * Drafted as clear, product-accurate starting copy — not reviewed by a lawyer,
 * and not a compliance sign-off. Before publishing, confirm clauses 4, 6 and 8
 * (AI processing, processors, retention) against what your backend actually
 * does, and name your real sub-processors.
 *
 * `body` entries: a string is a paragraph, an array is a bullet list.
 */
const privacy = {
  title: "Privacy Policy",
  standfirst:
    "What ExaminAI collects when you generate notes, why it needs it, who else touches it, and how to get it all back or deleted.",
  effective: "3 September 2026",
  version: "1.0",
  contactEmail: "privacy@examinai.app",
  sections: [
    {
      id: "what-this-covers",
      heading: "What this policy covers",
      body: [
        "This policy covers the ExaminAI app and website. It explains what happens to your account details, the study material you upload, and the notes generated from it.",
        "It does not cover Google's handling of your Google account, which is governed by Google's own privacy policy.",
      ],
    },
    {
      id: "what-we-collect",
      heading: "What we collect",
      body: [
        "Account details, from Google when you sign in: your name, email address and profile picture. We never see or store your Google password.",
        "The study material you upload or paste, and the notes, summaries, diagrams and PDFs generated from it.",
        "Usage information: which features you use, how many credits you spend and when, and what is in your history.",
        "Technical information sent by your browser: device and browser type, approximate location from your IP address, and error reports when something crashes.",
      ],
    },
    {
      id: "why-we-collect-it",
      heading: "Why we collect it",
      body: [
        [
          "to sign you in and keep you signed in",
          "to generate the notes you ask for",
          "to keep your history so you can find past notes",
          "to count credits accurately and process purchases",
          "to answer your support messages",
          "to find and stop abuse, fraud and attacks",
          "to fix crashes and work out which features are worth building",
        ],
      ],
    },
    {
      id: "ai-processing",
      heading: "How AI processing works",
      body: [
        "Generating notes means sending your study material to an AI model provider that runs the model for us. They process it only to return the result, under a contract that forbids using it for anything else.",
        "Your material is not used to train public AI models.",
        "If you would rather a piece of material never left your device, do not upload it. Generation cannot happen without sending it.",
      ],
    },
    {
      id: "what-we-never-do",
      heading: "What we never do",
      body: [
        [
          "sell your personal information, your material, or your notes",
          "show your material or notes to other users",
          "use what you upload to target advertising at you",
          "read your notes for any reason other than a support request you sent us or a specific abuse investigation",
        ],
      ],
    },
    {
      id: "who-can-see-it",
      heading: "Who else can see your data",
      body: [
        "You can, at any time. Beyond that, access is limited to the service providers that make the app work — hosting and databases, Google authentication, the AI model provider, the payment processor, and error monitoring. Each one gets only what it needs for its part.",
        "Our own team can access your content in two situations: you asked us for help with something specific, or we are investigating a report of abuse. Access is logged either way.",
        "We hand data to authorities only against a valid legal order, and we tell you when we are allowed to.",
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and sessions",
      body: [
        "One cookie keeps you signed in between visits. Removing it signs you out.",
        "There are no third-party advertising or cross-site tracking cookies in ExaminAI.",
      ],
    },
    {
      id: "retention",
      heading: "How long we keep things",
      body: [
        [
          "notes and uploaded material: until you delete them, or you delete your account",
          "account details: while your account is open, then up to 30 days after you delete it",
          "purchase records: seven years, because tax law requires it",
          "technical and error logs: 90 days",
        ],
        "After those periods the data is deleted or irreversibly anonymised.",
      ],
    },
    {
      id: "your-controls",
      heading: "What you can do with your data",
      body: [
        "Export it. Any note can be downloaded as a PDF, and you can request a copy of everything held under your account.",
        "Delete it. Individual notes go from your history immediately. Deleting your account removes your material, notes and profile.",
        "Correct it. If your name or email is wrong, fix it in your profile or write to us.",
        "Object or complain. Write to privacy@examinai.app, and if our answer does not satisfy you, you can take it to your local data protection authority.",
      ],
    },
    {
      id: "students-under-18",
      heading: "Students under 18",
      body: [
        "ExaminAI is built for students, and many of them are minors. Accounts for under-18s need a parent or guardian's permission.",
        "We do not knowingly collect data from children under 13. If a younger child has created an account, write to us and we will delete it and everything in it.",
        "No account, of any age, is profiled for advertising.",
      ],
    },
    {
      id: "security",
      heading: "How your data is protected",
      body: [
        "Traffic is encrypted in transit, stored data sits behind access controls, and only the engineers who need production access have it.",
        "No system is perfectly secure. If a breach ever affects your data, we will tell you what happened, what was exposed and what to do about it — without waiting to be asked.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      body: [
        "When this policy changes, the version and effective date at the top change with it. Significant changes are announced in the app before they take effect.",
      ],
    },
    {
      id: "contact",
      heading: "Contact and data requests",
      body: [
        "For anything about your data — a copy, a correction, a deletion, or a question about this policy — write to privacy@examinai.app. We reply within five working days.",
      ],
    },
  ],
};

export default privacy;
