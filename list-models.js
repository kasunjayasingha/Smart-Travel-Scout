async function listModels() {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCml1GUM8C3uzpEIe8F4YEJHaGljMWNeqo"
    );
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error.message);
      return;
    }
    
    console.log("Available models:");
    data.models.forEach(model => {
      console.log(`- ${model.name}`);
      if (model.supportedGenerationMethods) {
        console.log(`  Methods: ${model.supportedGenerationMethods.join(", ")}`);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
