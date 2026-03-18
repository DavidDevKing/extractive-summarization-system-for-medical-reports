from transformers import AutoTokenizer, AutoModel
import torch
from sklearn.cluster import KMeans
import numpy as np

from rouge_score import rouge_scorer

# 1. Load a Medical Model (SciBERT)
model_name = "allenai/scibert_scivocab_uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)



def extract_summary(text, num_sentences=3):
    # Split text into sentences
    sentences = text.split('. ')

    # Get embeddings for each sentence
    embeddings = []
    for sent in sentences:
        inputs = tokenizer(sent, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            output = model(**inputs)
        # Use the [CLS] token representation (the first token)
        embeddings.append(output.last_hidden_state[0][0].numpy())

    # Use KMeans to find the most "central" sentences
    kmeans = KMeans(n_clusters=num_sentences).fit(embeddings)
    avg = []
    for i in range(num_sentences):
        idx = np.argmin(np.linalg.norm(embeddings - kmeans.cluster_centers_[i], axis=1))
        avg.append(idx)

    return ". ".join([sentences[i] for i in sorted(avg)])


def extract_scores(reference_summary:str, candidate_summary:str):
    # Create the scorer object
    scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
    scores = scorer.score(reference_summary, candidate_summary)

    textscores = ""

    # Calculate scores
    for i, key in enumerate(scores):
        textscores += f"{key}: F1-Score = {scores[key].fmeasure:.4f}\n"
        textscores += f"{key}: Precision = {scores[key].precision:.4f}\n"
        textscores += f"{key}: Recall = {scores[key].recall:.4f}"
        if i != len(scores) - 1:
            textscores += "\n\n"


    return textscores



