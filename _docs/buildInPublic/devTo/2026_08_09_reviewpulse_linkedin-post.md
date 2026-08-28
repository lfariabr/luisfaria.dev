# LinkedIn post - ReviewPulse v3.0.0

Image: figures/2026_08_09_reviewpulse_social-card.png
Post after the DLE602 A3 submission. Put the article link in the FIRST comment,
not the body, so the post is not down-ranked for an outbound link.

---

My baseline beat my neural network... then the model that finally won cost 256 MB to ship.

Four months, two Masters subjects, 222 commits. I rebuilt ReviewPulse from a binary Amazon review classifier into a six-model aspect-based sentiment system, so it could handle the sentence that broke the old one:

"Great food but the service was dreadful!"

One review. Two opinions. The old model had to pick one and throw the other away.

The plan was the usual story: bigger model, better numbers. What actually happened:

- TF-IDF with logistic regression beat my BiLSTM
- A trigram reached 0.99 training accuracy and 0.42 on test. Pure memorisation, no understanding.
- ATAE-LSTM improved the exact slice I cared about and still lost the overall benchmark
- DistilBERT won every predictive metric, then turned model selection into a delivery problem: 2.64 MiB against 256.11 MiB

That last line is the part the coursework does not prepare you for. The best macro-F1 does not cancel storage, packaging and reproducibility. A model choice quietly became a shipping decision.

The part I am most pleased with is not a metric.

I put the gold labels in the demo next to every model's prediction. On that same sentence, both aspect-aware models still get one label wrong, and you can watch them fail.

I could have chosen an example where they succeed. The failure is more useful, and hiding it would have made the whole thing worth less.

Everything is public: code, 363 tests, reproducible packages with published checksums, and the independent reproduction that found my results on different hardware.

If you have built an NLP system, which taught you more: the model that won, or the one that failed in a way you could finally explain?

#MachineLearning #NLP #DeepLearning #MLEngineering #BuildInPublic

---

FIRST COMMENT:

Full writeup, with the confusion matrices, the attention and attribution views, and the packaging trade-off in detail: [dev.to link]

Code and release: https://github.com/lfariabr/review-pulse/releases/tag/v3.0.0
