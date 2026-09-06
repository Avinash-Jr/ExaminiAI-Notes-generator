import UserModel from "../models/user.models.js";
import { generateGeminiContent } from "../services/gemini.services.js";
import {buildPrompt} from "../utils/promptBuilder.js";

export const generateNotes = async (req, res) => {
  try {
    const { topic, subject, format, examType, revisionMode, includeDiagrams, includeCharts } = req.body();
    if(!topic || !subject || !format || !examType) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const user = await UserModel.findById(req.user.id);
    if(!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if(user.subscriptionStatus !== "active") {
      return res.status(403).json({ error: "User does not have an active subscription." });
    }
    if(user.credits < 10) {
        user.isCreditAvailable = false;
        await user.save();
      return res.status(403).json({ error: "Insufficient credits." });
    }

    const prompt = buildPrompt({ topic, subject, format, examType, revisionMode, includeDiagrams, includeCharts }); 

    const aiResponse = await generateGeminiContent(prompt); // Assume this function interacts with the AI model
    const notes = await NotesModel.create({
      userId: user._id,
      topic,
      subject,
      format,
      examType,
      revisionMode,
      includeDiagrams,
      includeCharts,
      content: aiResponse.text
    });

    

    user.credits -= 10; 
    if(user.credits < 10) {
        user.isCreditAvailable = false;
    }
    if(!Array.isArray(user.notes)) {
        user.notes = [];
    }
    user.notes.push(notes._id);
    await user.save();

    return res.status(201).json({  data:aiResponse, noteId: notes._id, creditRemaining: user.credits, message: "Notes generated successfully.", notes }); 

  }catch(error){
    console.error("Error generating notes:", error);
    res.status(500).json({ error: "An error occurred while generating notes." });
  }
}