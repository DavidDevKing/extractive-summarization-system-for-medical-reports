# Extractive Summarization System For Medical Reports
## A Computer Science Group project

### 🏥 Project Overview
This project focuses on the development of an extractive summarization system designed for medical reports. Unlike abstractive models that paraphrase text, this system identifies and extracts the most critical sentences directly from the original document to ensure 100% factual accuracy—a vital requirement in the medical field.

### 🚀 Features
**Extractive Engine**: Uses BERT-based sentence scoring to pick key sentences.

**Privacy Focused**: Designed to handle sensitive medical data with a focus on structural integrity.

**High Fidelity**: Zero risk of "hallucination" since no new words are generated.

### 🛠️ Tech Stack
**Language**: Python

**Frameworks**: Hugging Face Transformers, PyTorch

**Model**: BERT-base (or BioBERT for medical-specific terminology)

**Environment**: Google Colab (GPU accelerated)

**Evaluation**: ROUGE Metric

### 📂 Project Structure

* data/: Medical datasets (ignored in Git for privacy)
* notebooks/: Google Colab notebooks
* models/: Saved model checkpoints and weights
* src/: Python scripts for cleaning and processing
* README.md: Project documentation


### 📈 Methodology
Preprocessing: Tokenization and sentence segmentation using NLTK/SpaCy.

Sentence Ranking: Using a BERT encoder to represent sentences as numerical vectors (embeddings).

Selection: Applying a ranking algorithm (like TextRank or a Linear Classifier) to select the top-N sentences.

Evaluation: Comparing extracted summaries against human-annotated "gold" summaries using ROUGE-1 and ROUGE-L.


### 🧾 Results
| Model                           | ROUGE-1 <br> (f1) | ROUGE-2 <br> (f1) | ROUGE-L <br> (f1) | 
| ------------------------------- | :---------------: | :---------------: | :---------------: |
| Baseline (SciBERT + K-Means)    | 0.1921            | 0.0133            | 0.1060            |
| Fine-tuned BERTsum model        | TBD               | TBD               | TBD               |
