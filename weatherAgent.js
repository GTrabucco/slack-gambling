import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
const hf = new HfInference("HUGGINGFACE_API_KEY");
dotenv.config();
export async function weatherAgent(weatherData) {
  const prompt = `
    You are a weather assistant.
    You will receive 4 weather data objects, each representing one hour of an NFL game.
    Your task is to analyze these objects and provide a concise, informative weather outlook.
    Include temperature, precipitation, wind, and any notable conditions.
    Format the response as a short paragraph suitable for a fan to quickly understand the game-time weather.
    This is the data ${weatherData}
  `;

  try {
    const summary = await hf.textGeneration({
      model: "facebook/bart-large-cnn",
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        do_sample: false,
      },
    });

    console.log("Weather Summary:", summary[0].generated_text);
  } catch (err) {
    console.error(err);
  }
}
