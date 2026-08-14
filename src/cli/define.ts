import { defineFilm } from '../services/defineFilm.js';

async function main() {
  // Extract the raw idea from argv
  const rawIdea = process.argv[2];

  if (!rawIdea || rawIdea.trim() === '') {
    console.error("Error: Missing film idea. Please provide a film idea as a CLI argument.");
    console.error('Usage: npm run define -- "Explain why scientists think Europa has a subsurface ocean."');
    process.exit(1);
  }

  try {
    console.log("Analyzing film idea and generating FilmBrief via Gemini & ADK...");
    const filmBrief = await defineFilm(rawIdea);
    console.log("\n--- Generated Film Brief ---");
    console.log(JSON.stringify(filmBrief, null, 2));
    process.exit(0);
  } catch (error: any) {
    console.error("\nExecution failed!");
    console.error(`Error details: ${error.message}`);
    process.exit(1);
  }
}

main();
