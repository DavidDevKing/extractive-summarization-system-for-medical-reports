const summaryInput = document.getElementById("summaryInput");
const wordCount = document.getElementById("wordCount");
// const inputText = document.getElementById("summaryInput");
const numSentences = document.getElementById("numSentences");
const clearBtn = document.getElementById("clearBtn");
const generateBtn = document.getElementById("generateBtn");
const summaryOutput = document.getElementById("summaryOutput");
const copyBtn = document.getElementById("copyBtn");
const HF_MODEL = "facebook/bart-large-cnn";

//To count number of words users input
summaryInput.addEventListener("input", () => {
  const text = summaryInput.value.trim();

  if (text === "") {
    wordCount.textContent = 0;
    return;
  }

  const words = text.split(/\s+/);
  wordCount.textContent = words.length;
});

// const inputText = document.getElementById("summaryInput");
// const generateBtn = document.getElementById("generateBtn");
// const summaryOutput = document.getElementById("summaryOutput");
// const copyBtn = document.getElementById("copyBtn");

// generateBtn.addEventListener("click", async () => {
//   const text = inputText.value;

//   if (text.trim() === "") {
//     alert("Please enter some text to summarize.");
//     return;
//   }

//   summaryOutput.value = "Generating summary...";

// //   summaryOutput.value = "This is a sample AI generated summary";

//     try{
//       const response = await fetch(`https://api-inference.huggingface.co/models/${HF}`)
//     }
// });

//To input number of sentences

//To generate the summary
generateBtn.addEventListener("click", async () => {
  const text = summaryInput.value.trim();

  if (text === "") {
    alert("Please enter some text to summarize");
    return;
  }

  summaryOutput.value = "Generating summary...";

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": "Bearer hf_xxxxxxxxxxxxxxxxxxxxxxxxxx"   ← only if rate-limited
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 130, // tweak these
            min_length: 30,
            do_sample: false,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Most HF summarization models return an array with one object
    summaryOutput.value = data[0]?.summary_text || "No summary returned";
  } catch (error) {
    summaryOutput.value = "Error generating summary.\n" + error.message;
    console.error(error);
  }
});

//To clear user inputs
clearBtn.addEventListener("click", () => {
  summaryInput.value = "";
  summaryOutput.value = "";
  numSentences.value = "";
  wordCount.textContent = 0;
});

//To copy the summary
copyBtn.addEventListener("click", () => {
  const summaryText = summaryOutput.value;

  navigator.clipboard.writeText(summaryText);

  copyBtn.textContent = "Copied";

  setTimeout(() => {
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
  }, 2000);
});

// To disable the copy button when there is no summary
if (summaryOutput.value === "") {
  copyBtn.disabled = true;
}

//To clear the output when user changes the input
summaryInput.addEventListener("input", () => {
  summaryOutput.value = "";
});
