const summaryInput = document.getElementById("summaryInput");
const sentenceCount = document.getElementById("sentenceCount");
const numSentences = document.getElementById("numSentences");
const clearBtn = document.getElementById("clearBtn");
const generateBtn = document.getElementById("generateBtn");
const numSentencesInput = document.getElementById("numSentences");
const summaryOutput = document.getElementById("summaryOutput");
const summaryMeta = document.getElementById("summaryMeta");
const copyBtn = document.getElementById("copyBtn");

// Simple sentence counter
function countSentences(text) {
  if (!text.trim()) return 0;

  // Normalize newlines and multiple spaces
  let cleaned = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

  if (!cleaned) return 0;

  // Split on . ! ? followed by space or end of string
  // Negative lookbehind tries to avoid splitting on abbreviations like Dr. Mr. etc.
  const sentences = cleaned.split(
    /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s+|\.$/,
  );

  // Filter out fragments that are too short/meaningless
  return sentences.filter((s) => s.trim().length > 2).length;
}

//To generate the summary
const ENDPOINT =
  "https://moseleydev-medical-report-extractive-summarizer.hf.space/api/summarize";

// Safety check
if (!generateBtn || !summaryInput || !numSentencesInput || !summaryOutput) {
  console.error(
    "Missing one or more elements. Required IDs: generateBtn, reportText, numSentences, summaryOutput",
  );
  if (summaryOutput) {
    summaryOutput.value =
      "ERROR: Missing UI elements. Check console (F12) and HTML IDs.";
  }
  throw new Error("Required DOM elements not found");
}

generateBtn.addEventListener("click", async () => {
  console.log("Generate button clicked");

  const inputText = summaryInput.value.trim();
  const targetSentences = parseInt(numSentencesInput.value, 10);

  // Validation
  if (!inputText) {
    alert("Please paste a medical report first.");
    return;
  }

  if (isNaN(targetSentences) || targetSentences < 1) {
    alert("Please enter a number of sentences of at least 1.");
    return;
  }

  // Loading state
  generateBtn.disabled = true;
  generateBtn.textContent = "Summarizing...";
  summaryOutput.value = "Generating summary — please wait...";
  summaryOutput.style.color = "#0066cc";
  summaryOutput.style.fontStyle = "italic";

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text: inputText,
        num_sentences: targetSentences,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Server error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    console.log("API response:", data);

    // Extract summary
    const summaryText = data.summary || "";

    if (!summaryText.trim()) {
      throw new Error("No summary content was returned");
    }

    // Optional metadata line
    const meta = data.metadata || {};
    const engine = meta.engine || "SciBERT + KMeans";
    const procTime = meta.processing_time_ms
      ? `~${Math.round(meta.processing_time_ms / 100) / 10}s`
      : "";

    summaryMeta.textContent = procTime
      ? `\n\n(Engine: ${engine} • Processing: ${procTime})`
      : `\n\n(Engine: ${engine})`;

    // Put result in textarea
    summaryOutput.value = summaryText;
    summaryOutput.style.color = "#000";
    summaryOutput.style.fontStyle = "normal";
    copyBtn.disabled = false;
  } catch (err) {
    console.error("Summary failed:", err);

    summaryOutput.value = `ERROR: Could not generate summary\n\n${err.message}\n\nCheck console (F12) for more details.`;
    summaryOutput.style.color = "#c0392b";
    summaryOutput.style.fontStyle = "normal";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Summary";
  }
});

summaryInput.addEventListener("input", () => {
  if (summaryInput.value.trim() !== "") {
    generateBtn.disabled = false;
  } else {
    generateBtn.disabled = true;
  }
});

// Live sentence count as user types / pastes
summaryInput.addEventListener("input", () => {
  const count = countSentences(summaryInput.value);

  if (sentenceCount) {
    if (count === 0) {
      sentenceCount.textContent = "";
    } else if (count === 1) {
      sentenceCount.textContent = "≈ 1";
    } else {
      sentenceCount.textContent = `≈ ${count}`;
    }
  }
});

// Optional: trigger once on page load (in case of pre-filled text)
summaryInput.dispatchEvent(new Event("input"));

//To clear user inputs
clearBtn.addEventListener("click", () => {
  summaryInput.value = "";
  summaryOutput.value = "";
  numSentences.value = "3";
  sentenceCount.textContent = "";
  summaryMeta.textContent = "";
  copyBtn.disabled = true;
  generateBtn.disabled = true;
});

//To copy the summary
copyBtn.addEventListener("click", () => {
  const summaryText = summaryOutput.value;

  navigator.clipboard.writeText(summaryText);

  copyBtn.textContent = "Copied!";

  setTimeout(() => {
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
  }, 2000);
});

//To clear the output when user changes the input
summaryInput.addEventListener("input", () => {
  summaryOutput.value = "";
});
