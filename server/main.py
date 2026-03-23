from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn as nn
import spacy
import spacy.cli
import time
import os

app = FastAPI(
    title="Clinical Extractive Summarization",
    description="SciBERT + BERTsum Fine-Tuned Engine for Medical Reports"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ARCHITECTURE DEFINITION ---
class BioExtractor(nn.Module):
    def __init__(self, model_name):
        super(BioExtractor, self).__init__()
        self.bert = AutoModel.from_pretrained(model_name)
        # The classification layer that predicts sentence salience [cite: 279]
        self.classifier = nn.Linear(768, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0, :]
        return self.sigmoid(self.classifier(cls_output))

# Global variables to cache models in memory
tokenizer = None
model = None
nlp = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class ReportRequest(BaseModel):
    text: str
    num_sentences: int = 3

@app.get("/")
def health_check():
    return {
        "status": "Engine is running", 
        "message": "Send POST requests to /api/summarize",
        "docs": "Visit /docs for the Swagger UI"
    }

@app.post("/api/summarize")
def summarize_medical_report(request: ReportRequest):
    start_time = time.time()
    
    global tokenizer, model, nlp, device
    if model is None:
        print("Initializing Fine-Tuned SciBERT and SpaCy...")
        
        # Loading the base tokenizer
        model_name = "allenai/scibert_scivocab_uncased"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        model = BioExtractor(model_name)
        
        # Loading the trained weights from .pt file
        model_path = "med_summarizer_trained.pt" 
        if os.path.exists(model_path):
            print(f"Loading fine-tuned weights from {model_path}...")
            # map_location ensures it works even if Hugging Face runs on a CPU space
            model.load_state_dict(torch.load(model_path, map_location=device))
        else:
            print(f"WARNING: {model_path} not found! Upload it to your Space.")
            
        model.to(device)
        model.eval() 
        
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Downloading SpaCy English model...")
            spacy.cli.download("en_core_web_sm")
            nlp = spacy.load("en_core_web_sm")
            
        print("Models loaded successfully!")

    # 1. Safely split text into sentences using SpaCy NLP
    doc = nlp(request.text)

    sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
    
    # Edge case: Report is too short to summarize
    if len(sentences) <= request.num_sentences:
        return {"summary": request.text, "metadata": {"status": "too_short"}}

    # 2. Get probability scores for each sentence using the fine-tuned model
    scores = []
    with torch.no_grad():
        for sent in sentences:
            inputs = tokenizer(sent, return_tensors="pt", truncation=True, padding='max_length', max_length=128).to(device)
            output = model(inputs['input_ids'], inputs['attention_mask'])
            scores.append(output.item())

    # 3. Rank and select the top N sentences
    scored_sentences = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    top_indices = [idx for idx, score in scored_sentences[:request.num_sentences]]

    # 4. Sort indices chronologically to maintain original report flow [cite: 248]
    top_indices_sorted = sorted(top_indices)
    final_summary = " ".join([sentences[i] for i in top_indices_sorted])
    
    process_time = round((time.time() - start_time) * 1000, 2)
    
    return {
        "summary": final_summary,
        "metadata": {
            "processing_time_ms": process_time,
            "original_length": len(sentences),
            "summary_length": len(top_indices_sorted),
            "engine": "SciBERT + BERTsum Fine-Tuned"
        }
    }