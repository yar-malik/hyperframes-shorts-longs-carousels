<!--
LinkedIn article for the Voho Page. Every number is from https://voho.ai/models/voho-saudi-stt-small, read
2026-10-04. The Phonon-2 line is from Solo Founders (solofounders.beehiiv.com, "A solo founder beat OpenAI's
speech model at 1/10th the size"), read the same day. "World's first" left out: not confirmed by Yar.
-->

# Unbelievable! Voho just launched a Saudi speech model that makes 62% fewer errors than OpenAI's

Voho Saudi STT Small is out, and the weights are on Hugging Face. It turns Saudi Arabic speech into text: Najdi, Hijazi and Khaleeji, the way people actually talk on the phone in Riyadh, Jeddah and Dammam.

On 4,582 Saudi clips it never saw in training, its word error rate is 39.2%. The OpenAI model it started from, Whisper Small, scored 103.9% on the same clips.

Yes, over 100%. That means Whisper wrote more wrong words than there were words spoken. That's what happens when a model learned Arabic from the news and then hears a phone call from Riyadh.

## Why a small model

Most of AI is racing to get bigger. This week Solo Founders wrote about Manan Gupta, whose Phonon-2 speech model is a 164 MB download and beats Whisper on average. Same instinct here.

Voho Saudi STT Small has 0.24 billion parameters and downloads as one 967 MB file. It runs on a CPU or a small GPU with the standard Transformers pipeline, and once it's downloaded nothing calls out. For a bank or a hospital that can't send customer audio abroad, that's the whole point.

## The numbers, dialect by dialect

Word error rate, before (Whisper Small) and after (Voho), on the held-out test set. Lower is better.

- Najdi (Riyadh, central), 1,704 clips: 102.8% → 35.7%
- Hijazi (Jeddah, Makkah), 809 clips: 104.3% → 36.3%
- Khaleeji (Eastern Province), 1,150 clips: 106.6% → 43.2%
- Saudi, dialect unlabelled, 762 clips: 135.8% → 51.2%
- Modern Standard Arabic, 157 clips: 52.6% → 33.7%

Character error rate fell from 69.0% to 16.9%. That gap matters. A lot of the remaining "wrong words" are near-misses in spelling, like مقسر written for مقصر. The word was heard. It was spelled the way it sounds.

Both models were scored the same way, after the standard Arabic normalisation (diacritics removed, alef forms unified, ta marbuta and alef maqsura normalised, punctuation removed).

For scale, the Open Universal Arabic ASR Leaderboard lists Whisper Large v3 at 56.0% on the SADA test set. That's a different scoring run, so it isn't a like-for-like comparison, but it's a model several times this size.

## How it was trained

Nothing exotic, which is sort of the point.

1. Base model: OpenAI Whisper Small, 244M parameters, MIT licence.
2. Data: SADA, the Saudi Audio Dataset for Arabic published by SDAIA and the National Center for AI. About 187,000 clips of Saudi television speech, with dialect labels.
3. Cleaning: kept Najdi, Hijazi, Khaleeji, unlabelled Saudi and Modern Standard Arabic. Removed overlapping speakers, non-Saudi dialects and clips over 30 seconds.
4. Targets: transcripts with diacritics removed.
5. Setup: 2 epochs, batch size 32, learning rate 1e-5, bf16, on one NVIDIA L4.

The training loss started at 5.2 and was under 1 within 250 steps, as the model let go of formal Arabic. One GPU. Not a cluster.

## What it gets wrong

We'd rather say this before you find it.

- It was trained mostly on television speech. Real phone audio (8 kHz, compressed, noisy) is harder, and accuracy on calls will be lower than the table above.
- The speakers in the training data skew male.
- Transcripts come out without diacritics.
- It's the small model. Fast, but less accurate than a bigger one would be. We haven't published a speed benchmark yet.

Here's a real Najdi example, picked near the median error rate. Someone said "يا ليتك يا فيصل تعرف وش إللي أبغاه". The model wrote "ليلتك يا فيصل تعرف وش اللي أبغى". Close. Not perfect.

## Try it

Three lines of Python:

pip install transformers torch

from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="VohoAI/voho-saudi-stt-small")
print(asr("call.wav", generate_kwargs={"language": "arabic", "task": "transcribe"})["text"])

The weights are under CC BY-NC-SA 4.0, so research and non-commercial use only. Please cite SADA (SDAIA, 2022) if you use it.

It's also the first of three Voho models that make one voice agent: Saudi STT Small hears the caller, Voho Saudi Chat 4B decides what to say, and Voho Saudi Speak 0.6B says it the way a Saudi would. For production calls, including in-Kingdom and on-premise deployment, the Voho API runs that whole stack.

The full model card, the charts and the research write-up are at voho.ai/models/voho-saudi-stt-small. If you want an agent that answers your phone in Saudi Arabic, you can build one at app.voho.ai.
