import { generateResearchQuestions } from '../services/generateResearchQuestions.js';
import { type FilmBrief } from '../domain/filmBrief.js';

// An APPROVED version of the Europa film brief generated in Phase 2
const approvedEuropaBrief: FilmBrief = {
  id: "FB-europa-subsurface-ocean",
  title: "Europa's Hidden Ocean: The Scientific Evidence",
  scientificTopic: "Planetary Science, Astrobiology",
  scientificQuestion: "What scientific evidence leads researchers to hypothesize the existence of a subsurface ocean on Jupiter's moon Europa, and what are its potential implications?",
  communicationObjective: "To educate high-school students on the key scientific observations and deductions that support the theory of a subsurface ocean on Europa, fostering an appreciation for planetary science and astrobiology.",
  targetAudience: "High-school students",
  audienceKnowledgeLevel: "Basic understanding of the solar system, gravity, and states of matter. No prior specialized knowledge of planetary geology is assumed.",
  format: "Educational Film",
  durationMinutes: 8,
  tone: "Engaging, inquisitive, clear, scientifically accurate, and inspiring",
  learningGoals: [
    "Identify the primary characteristics of Europa that make it a compelling target for astrobiological study.",
    "Explain at least three major lines of evidence (e.g., magnetic field, surface features, tidal heating) that suggest a subsurface ocean.",
    "Understand the concept of tidal heating and its role in maintaining a liquid ocean beneath Europa's ice shell.",
    "Recognize the astrobiological significance of a liquid water ocean on Europa."
  ],
  scope: [
    "Introduction to Europa as one of Jupiter's Galilean moons.",
    "Explanation of tidal forces and how Jupiter's gravity can heat Europa's interior.",
    "Discussion of evidence from the Galileo mission, specifically magnetic field anomalies.",
    "Analysis of Europa's surface features, including cracks, ridges, and 'chaos terrain', and their interpretation as evidence of subsurface activity.",
    "Brief mention of observed water plumes and their implications.",
    "Overview of why a subsurface ocean is considered a potential habitat for life."
  ],
  outOfScope: [
    "Detailed physics of orbital mechanics or resonant orbits.",
    "In-depth history of space missions to Jupiter beyond key Europa observations.",
    "Speculation on the specific forms or biochemistry of potential extraterrestrial life on Europa.",
    "Detailed engineering challenges or design aspects of future Europa missions."
  ],
  constraints: [
    "All scientific explanations must be accessible and engaging for a high-school audience.",
    "Visualizations should be accurate and aid in understanding complex concepts (e.g., tidal heating, subsurface ocean structure).",
    "Adherence to strict 8-minute runtime, necessitating conciseness.",
    "Focus on observational evidence and scientific reasoning rather than hypothetical scenarios."
  ],
  researchRequirements: [
    "Specific data and interpretations from the Galileo mission regarding Europa's induced magnetic field.",
    "Scientific consensus on the mechanisms of tidal heating for icy moons and their application to Europa.",
    "Detailed geological analysis and interpretations of Europa's surface features (e.g., chaos terrain formation, ridge development, plume origins).",
    "Current scientific models for Europa's interior structure, including estimated ice shell thickness and ocean depth/composition.",
    "Confirmed observations and scientific interpretations of water plumes emanating from Europa's surface.",
    "The scientific rationale for considering liquid water environments as potentially habitable for life."
  ],
  status: "APPROVED" // Enforce APPROVED to satisfy the gatekeeper
};

async function main() {
  try {
    console.log("Generating scientific research questions for the approved Europa brief...");
    const questions = await generateResearchQuestions(approvedEuropaBrief);
    console.log(`\n--- Generated ${questions.length} Research Questions ---`);
    console.log(JSON.stringify(questions, null, 2));
    process.exit(0);
  } catch (error: any) {
    console.error("\nExecution failed!");
    console.error(`Error details: ${error.message}`);
    process.exit(1);
  }
}

main();
