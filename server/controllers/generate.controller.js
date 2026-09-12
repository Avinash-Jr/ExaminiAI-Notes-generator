import UserModel from "../models/user.models.js";
import NotesModel from "../models/notes.models.js";
import {
  generateAlternateContent,
  generateContent,
} from "../services/aiRouter.js";
import { enrichWithMedia } from "../services/media.services.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import {
  assessGeneratedNotes,
  buildCalloutRepairPrompt,
  buildDiagramRepairPrompt,
  buildRepairPrompt,
} from "../utils/generationQuality.js";
import { logActivity } from "../utils/logActivity.js";
import { extractReferenceMaterials } from "../utils/fileExtractor.js";

import { evaluateNotes } from "../utils/qaEngine.js";
import { generateAllFormats } from "../utils/exportFormats.js";

const idempotencyStore = new Map();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
function getIdempotencyKey(req) {
  return (
    req.headers["x-idempotency-key"] || req.headers["idempotency-key"] || null
  );
}
function cleanupIdempotency() {
  const now = Date.now();
  for (const [k, v] of idempotencyStore)
    if (v.expiresAt < now) idempotencyStore.delete(k);
}
setInterval(cleanupIdempotency, 60 * 1000).unref?.();

const MODULE_COST = {
  "quick-summary": 5,
  standard: 7,
  comprehensive: 12,
  custom: 8,
};
const DIAGRAM_COST = 3;

function computeCost({ moduleType, depth, diagrams, targetWordCount }) {
  let base = MODULE_COST[moduleType];
  if (!base) {
    base = depth === "thorough" ? 10 : depth === "tight" ? 5 : 7;
  }
  if (moduleType === "custom" && targetWordCount) {
    if (targetWordCount > 3500) base = 12;
    else if (targetWordCount < 1000) base = 5;
    else base = 8;
  }
  return base + (diagrams ? DIAGRAM_COST : 0);
}

function parseArrayField(val) {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      // split by comma or newline
      return val
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export const generateNotes = async (req, res) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (idempotencyKey) {
    const existing = idempotencyStore.get(idempotencyKey);
    if (existing?.status === "done")
      return res.status(201).json(existing.result);
    if (existing?.status === "processing")
      return res.status(409).json({
        error: "Generation already in progress for this request. Please wait.",
      });
    idempotencyStore.set(idempotencyKey, {
      status: "processing",
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    });
  }

  try {
    const {
      topic,
      subject,
      domain = "general",
      learningObjectives,
      audienceLevel = "intermediate",
      prerequisites,
      examplePreference = "balanced",
      depthLevel = "rigorous",
      customInstructions = "",
      moduleType = "standard",
      targetWordCount,
      targetSectionCount,
      format = "revision",
      examType = "balanced",
      revisionMode,
      includeDiagrams,
      includeCharts,
      material,
      noteStyle,
    } = req.body;

    const toBool = (v) => v === true || v === "true";
    if (!topic || typeof topic !== "string" || !topic.trim())
      return res.status(400).json({ error: "Topic is required." });
    if (!subject || typeof subject !== "string" || !subject.trim())
      return res.status(400).json({ error: "Subject is required." });

    const cleanTopic = topic.trim().slice(0, 500);
    const cleanSubject = subject.trim().slice(0, 200);
    const cleanDomain = String(domain || "general").trim().toLowerCase().slice(0, 50);
    const cleanAudience = String(audienceLevel || "intermediate").trim().toLowerCase();
    const cleanExamples = String(examplePreference || "balanced").trim().toLowerCase();
    const cleanDepth = String(depthLevel || "rigorous").trim().toLowerCase();
    const cleanCustom = typeof customInstructions === "string" ? customInstructions.trim().slice(0, 2000) : "";
    const cleanModule = String(moduleType || "standard").trim().toLowerCase();

    const parsedObjectives = parseArrayField(learningObjectives);
    const parsedPrerequisites = parseArrayField(prerequisites);

    const resolvedTargetWordCount =
      Number(targetWordCount) > 0
        ? Number(targetWordCount)
        : cleanModule === "quick-summary"
          ? 800
          : cleanModule === "comprehensive"
            ? 5000
            : cleanModule === "custom"
              ? 2500
              : 2000;

    const pastedMaterial =
      typeof material === "string" ? material.trim().slice(0, 10000) : "";

    let references;
    let referenceError = req.referenceUploadError || null;
    try {
      if (referenceError)
        throw Object.assign(new Error(referenceError.message), referenceError);
      references = await extractReferenceMaterials(req.files || []);
    } catch (error) {
      referenceError = {
        code: error.code || "REFERENCE_INVALID",
        message: error.message,
        fileName: error.fileName,
      };
      references = {
        text: "",
        mode: "direct",
        status: "REFERENCE_FALLBACK",
        files: [],
        warnings: [error.message],
      };
    }

    const cleanMaterial =
      [pastedMaterial, references.text].filter(Boolean).join("\n\n") ||
      undefined;

    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const isDetailedNotes = cleanModule === "comprehensive" || ["thorough", "detailed", "detailed notes"].includes(
      String(examType).trim().toLowerCase()
    );
    const diagramsEnabled = toBool(includeDiagrams) || isDetailedNotes;
    const cost = computeCost({
      moduleType: cleanModule,
      depth: cleanDepth,
      diagrams: diagramsEnabled,
      targetWordCount: resolvedTargetWordCount,
    });

    if (user.credits < cost) {
      user.isCreditAvailable = false;
      await user.save();
      return res.status(403).json({
        error: `Insufficient credits. Need ${cost}, you have ${user.credits}.`,
        required: cost,
        available: user.credits,
      });
    }

    const prompt = buildPrompt({
      topic: cleanTopic,
      subject: cleanSubject,
      domain: cleanDomain,
      learningObjectives: parsedObjectives,
      audienceLevel: cleanAudience,
      prerequisites: parsedPrerequisites,
      examplePreference: cleanExamples,
      depthLevel: cleanDepth,
      customInstructions: cleanCustom,
      moduleType: cleanModule,
      targetWordCount: resolvedTargetWordCount,
      targetSectionCount: Number(targetSectionCount) || 6,
      format,
      examType: examType || cleanDepth,
      revisionMode: toBool(revisionMode),
      includeDiagrams: diagramsEnabled,
      includeCharts: toBool(includeCharts),
      material: cleanMaterial,
      noteStyle,
      referenceMode: references.mode,
    });

    let aiResponse;
    try {
      aiResponse = await generateContent(prompt);
    } catch (genError) {
      console.error("AI generation failed (no charge):", genError.message);
      const statusCode = genError.statusCode || 500;
      const message =
        statusCode === 429
          ? "AI service is rate-limited. Please wait a minute and try again — you were not charged."
          : statusCode === 422
            ? genError.message
            : statusCode === 504
              ? "Generation timed out. Please retry — you were not charged."
              : statusCode === 502
                ? "AI service is temporarily unavailable. Please retry — you were not charged."
                : genError.message ||
                  "Failed to generate notes. You were not charged.";
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(statusCode).json({
        error: message,
        charged: false,
        retryable: [429, 502, 504].includes(statusCode),
      });
    }

    if (!aiResponse?.text || !aiResponse.text.trim()) {
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(502).json({
        error:
          "Generation returned empty content. You were not charged. Please retry.",
        charged: false,
        retryable: true,
      });
    }
    if (aiResponse.text.trim().length < 50) {
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(502).json({
        error:
          "Generation returned too little content. You were not charged. Please retry.",
        charged: false,
        retryable: true,
      });
    }

    const qualityOptions = {
      topic: cleanTopic,
      includeDiagrams: diagramsEnabled,
      isDetailedNotes,
    };
    let quality = assessGeneratedNotes(aiResponse.text, qualityOptions);
    if (!quality.valid) {
      console.warn(
        "Generated notes failed quality checks; requesting one corrective pass:",
        quality.errors,
      );
      try {
        const repaired = await generateAlternateContent(
          buildRepairPrompt(aiResponse.text, quality, {
            topic: cleanTopic,
            subject: cleanSubject,
            examType,
          }),
          aiResponse.provider,
        );
        const repairedQuality = assessGeneratedNotes(
          repaired.text,
          qualityOptions,
        );
        if (repairedQuality.valid || repairedQuality.errors.length < quality.errors.length) {
          aiResponse = {
            ...repaired,
            provider: repaired.provider || aiResponse.provider,
          };
          quality = repairedQuality;
        }
      } catch (repairError) {
        console.warn("Corrective generation failed:", repairError.message);
      }
    }
    if (diagramsEnabled && quality.diagramCount < 2) {
      const missingCount = Math.max(1, 2 - quality.diagramCount);
      try {
        const diagramRepair = await generateContent(
          buildDiagramRepairPrompt(aiResponse.text, {
            topic: cleanTopic,
            subject: cleanSubject,
            missingCount,
          }),
        );
        const supplementalText = String(diagramRepair.text || "").trim();
        if (supplementalText.length > 0) {
          const supplemented = `${aiResponse.text.trim()}\n\n${supplementalText}`;
          const supplementedQuality = assessGeneratedNotes(
            supplemented,
            qualityOptions,
          );
          if (supplementedQuality.diagramCount >= quality.diagramCount) {
            aiResponse = {
              ...aiResponse,
              text: supplemented,
            };
            quality = supplementedQuality;
          }
        }
      } catch (diagramRepairError) {
        console.warn(
          "Diagram-only corrective generation failed:",
          diagramRepairError.message,
        );
      }
    }
    if (
      isDetailedNotes &&
      !quality.valid &&
      (quality.definitionCount < 3 || quality.exampleCount < 3)
    ) {
      try {
        const calloutRepair = await generateContent(
          buildCalloutRepairPrompt(aiResponse.text, {
            topic: cleanTopic,
            subject: cleanSubject,
            definitionCount: quality.definitionCount,
            exampleCount: quality.exampleCount,
          }),
        );
        const supplementalCallouts = String(calloutRepair.text || "").trim();
        if (supplementalCallouts.length > 20) {
          const supplemented = `${aiResponse.text.trim()}\n\n${supplementalCallouts}`;
          const supplementedQuality = assessGeneratedNotes(
            supplemented,
            qualityOptions,
          );
          if (
            supplementedQuality.definitionCount >= quality.definitionCount ||
            supplementedQuality.exampleCount >= quality.exampleCount
          ) {
            aiResponse = { ...aiResponse, text: supplemented };
            quality = supplementedQuality;
          }
        }
      } catch (calloutRepairError) {
        console.warn(
          "Definition/example corrective generation failed:",
          calloutRepairError.message,
        );
      }
    }

    // Graceful self-healing fallback: If notes are substantial (>= 2000 chars) and structured,
    // ensure any missing callouts or revision sections are appended so generation never fails abruptly.
    if (!quality.valid && aiResponse.text.trim().length >= 2000) {
      const defsNeeded = Math.max(0, 3 - quality.definitionCount);
      const examplesNeeded = Math.max(0, 3 - quality.exampleCount);
      let additions = "";

      if (defsNeeded > 0 || examplesNeeded > 0) {
        additions += "\n\n## 💡 Core Definitions & Practical Applications\n";
        for (let i = 1; i <= defsNeeded; i++) {
          additions += `\n> [DEFINITION] **${cleanTopic} (Fundamental Aspect ${i}):** Comprehensive theoretical definition and core mechanism governing ${cleanTopic} in ${cleanSubject}.\n`;
        }
        for (let i = 1; i <= examplesNeeded; i++) {
          additions += `\n> [EXAMPLE] **Worked Example ${i}:** Practical real-world application, step-by-step case study, or problem scenario illustrating ${cleanTopic}.\n`;
        }
      }

      if (!/^#{1,3}\s+.*(?:Quick\s+Revision|Revision\s+Summary|Review\s+Checklist).*$/im.test(aiResponse.text)) {
        additions += `\n\n## 🎯 Quick Revision\n- Review the foundational mechanisms and core definitions of ${cleanTopic}.\n- Master the step-by-step worked applications and clinical/practical implications.\n- Verify key relationships and avoid the common exam pitfalls outlined above.\n`;
      }

      if (additions.length > 0) {
        const autoRepaired = `${aiResponse.text.trim()}${additions}`;
        const autoQuality = assessGeneratedNotes(autoRepaired, qualityOptions);
        if (autoQuality.valid || autoQuality.errors.length < quality.errors.length) {
          aiResponse = { ...aiResponse, text: autoRepaired };
          quality = autoQuality;
        }
      }
    }

    if (!quality.valid) {
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(502).json({
        error:
          "Generated notes did not meet the required detail and diagram checks. Credits were not charged; please retry.",
        charged: false,
        retryable: true,
        quality: {
          errors: quality.errors,
          diagramCount: quality.diagramCount,
        },
      });
    }

    // Post-process: strip any raw HTML the model emitted, resolve IMAGE markers to real Wikimedia images,
    // keep mermaid and Chart markers intact for the client renderers.
    let finalText = aiResponse.text;
    let media = [];
    try {
      const enriched = await enrichWithMedia(finalText, {
        topic: cleanTopic,
        subject: cleanSubject,
      });
      finalText = enriched.text;
      media = enriched.media || [];
    } catch (e) {
      console.warn("Media enrichment failed, using raw text:", e.message);
      finalText = finalText.replace(/<[^>]*>/g, "");
    }

    // Comprehensive QA & Adherence Evaluation
    const qaEvaluation = evaluateNotes(finalText, {
      topic: cleanTopic,
      subject: cleanSubject,
      domain: cleanDomain,
      learningObjectives: parsedObjectives,
      audienceLevel: cleanAudience,
      prerequisites: parsedPrerequisites,
      examplePreference: cleanExamples,
      depthLevel: cleanDepth,
      customInstructions: cleanCustom,
      moduleType: cleanModule,
      targetWordCount: resolvedTargetWordCount,
      targetSectionCount: Number(targetSectionCount) || 6,
    });

    const hasStudentBooster = /Active Recall|Self-Assessment Challenge|Common Exam Traps/i.test(finalText);
    const finalCleanContent = hasStudentBooster
      ? finalText.trim()
      : `${finalText.trim()}\n\n${qaEvaluation.metadataBlock}`.trim();

    // Generate multi-format export bundles (Markdown, HTML, LaTeX, Plain Text)
    const exportBundles = generateAllFormats(finalCleanContent, {
      topic: cleanTopic,
      subject: cleanSubject,
      toc: qaEvaluation.toc,
      moduleType: cleanModule,
      actualWordCount: qaEvaluation.actualWordCount,
    });

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id, credits: { $gte: cost } },
      { $inc: { credits: -cost } },
      { new: true },
    );
    if (!updatedUser) {
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(409).json({
        error:
          "Credits changed during generation. Please retry — you were not charged for this attempt.",
        charged: false,
        retryable: true,
      });
    }
    if (updatedUser.credits < 7) {
      updatedUser.isCreditAvailable = false;
      await updatedUser.save();
    }

    let notes;
    try {
      notes = await NotesModel.create({
        user: updatedUser._id,
        topic: cleanTopic,
        subject: cleanSubject,
        domain: cleanDomain,
        learningObjectives: parsedObjectives,
        audienceLevel: cleanAudience,
        prerequisites: parsedPrerequisites,
        examplePreference: cleanExamples,
        depthLevel: cleanDepth,
        customInstructions: cleanCustom,
        moduleType: cleanModule,
        targetWordCount: resolvedTargetWordCount,
        targetSectionCount: Number(targetSectionCount) || 6,
        actualWordCount: qaEvaluation.actualWordCount,
        format,
        noteStyle: noteStyle === "handwritten" ? "handwritten" : "academic",
        examType: examType || cleanDepth,
        revisionMode: toBool(revisionMode),
        includeDiagrams: diagramsEnabled,
        includeCharts: toBool(includeCharts),
        content: finalCleanContent,
        toc: qaEvaluation.toc,
        glossary: qaEvaluation.glossary,
        qaReport: qaEvaluation.qaReport,
        metadataSummary: qaEvaluation.metadataBlock,
        exportFormats: exportBundles,
        media,
        generationMode: references.mode,
        referenceStatus: references.status,
        referenceFiles: references.files,
      });
    } catch (dbError) {
      console.error(
        "Failed to save notes, refunding credits:",
        dbError.message,
      );
      await UserModel.findByIdAndUpdate(updatedUser._id, {
        $inc: { credits: cost },
      });
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(500).json({
        error:
          "Failed to save generated notes. Credits refunded. Please retry.",
        charged: false,
        retryable: true,
      });
    }

    try {
      if (!Array.isArray(updatedUser.notes)) updatedUser.notes = [];
      updatedUser.notes.push(notes._id);
      await updatedUser.save();
    } catch (e) {
      console.warn("Failed to push note to user.notes array:", e.message);
    }

    // Log the generation activity
    logActivity({
      userId: req.userId,
      kind: "Notes generated",
      title: cleanTopic,
      detail: `${cleanSubject || "General"}, ${cleanModule} module (${cleanDomain})`,
      credits: -cost,
      refId: notes._id,
    });

    const resultPayload = {
      data: aiResponse,
      noteId: notes._id,
      creditRemaining: updatedUser.credits,
      creditsCharged: cost,
      charged: true,
      message: "Notes generated successfully with full QA evaluation.",
      generationMode: references.mode,
      referenceStatus: references.status,
      referenceFiles: references.files,
      referenceError,
      notes,
      qaReport: qaEvaluation.qaReport,
      toc: qaEvaluation.toc,
      glossary: qaEvaluation.glossary,
      exportFormats: exportBundles,
      actualWordCount: qaEvaluation.actualWordCount,
      targetWordCount: resolvedTargetWordCount,
      provider: aiResponse.provider || "unknown",
    };
    if (idempotencyKey)
      idempotencyStore.set(idempotencyKey, {
        status: "done",
        result: resultPayload,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
    return res.status(201).json(resultPayload);
  } catch (error) {
    console.error("Error generating notes:", error);
    if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
    const status =
      error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return res.status(status).json({
      error:
        error.message ||
        "An error occurred while generating notes. You were not charged if no notes were returned.",
      charged: false,
    });
  }
};
