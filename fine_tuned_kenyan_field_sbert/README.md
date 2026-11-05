---
tags:
- sentence-transformers
- sentence-similarity
- feature-extraction
- dense
- generated_from_trainer
- dataset_size:1760
- loss:MultipleNegativesRankingLoss
base_model: sentence-transformers/all-MiniLM-L6-v2
widget:
- source_sentence: Just purchased a 4-door modular wardrobe from furniture store;
    need on-site assembly of drawers, hanging rails, and soft-close hinges.
  sentences:
  - Housekeeping & Post-Construction Cleaning Lead holding IICRC Carpet Cleaning Certified
    certification, specialized in grout line acid washing and sanitization, industrial
    rotary floor scrubber operation, and telescopic squeegee high-window washing.
    Experienced in field diagnostics, emergency service restoration, and standard
    deep house cleaning & post-construction scrubbing procedures.
  - Fire Protection Field Technician holding Addressable Fire Alarm Technician certification,
    specialized in diesel fire pump automated start test, addressable fire alarm panel
    programming, and manual call point (mcp) loop testing. Experienced in field diagnostics,
    emergency service restoration, and standard fire alarm & fm-200 gas suppression
    systems procedures.
  - Furniture Assembly & Fixture Tech holding Interior Finishing Specialist certification,
    specialized in mortise door lock and handle replacement, flat-pack wardrobe and
    cabinet assembly, and curtain rod and window blind drilling. Experienced in field
    diagnostics, emergency service restoration, and standard general handyman, tv
    mounting & furniture assembly procedures.
- source_sentence: Solid wooden front door lock is sticking and deadbolt won't catch
    in the strike plate. Requires mortise lock replacement.
  sentences:
  - General Maintenance Handyman holding Power Tool Safety Certification certification,
    specialized in mortise door lock and handle replacement, decorative wall mirror
    and artwork hanging, and curtain rod and window blind drilling. Experienced in
    field diagnostics, emergency service restoration, and standard general handyman,
    tv mounting & furniture assembly procedures.
  - Water Hydraulics & Well Tech holding Grundfos Product Specialist certification,
    specialized in submersible borehole pump diagnostics, motor control center (mcc)
    starter repair, and deep-well riser pipe retrieval. Experienced in field diagnostics,
    emergency service restoration, and standard borehole & submersible water pumps
    procedures.
  - Public Health Pest Management Officer holding Public Health Officer Certification
    certification, specialized in rodent bait station servicing, thermal fogging machine
    operation, and residual chemical surface spraying. Experienced in field diagnostics,
    emergency service restoration, and standard fumigation & pest control services
    procedures.
- source_sentence: Install new DStv Explora decoder with Smart LNB, run coaxial cable
    to sitting room, and activate satellite television package.
  sentences:
  - WISP & Microwave Link Engineer holding MikroTik MTCNA / MTCRE certification, specialized
    in rf noise spectrum analysis, gigabit poe surge protection installation, and
    mikrotik routeros wireless configuration. Experienced in field diagnostics, emergency
    service restoration, and standard point-to-point wireless & microwave internet
    (wisp) procedures.
  - Certified Fire Safety Systems Inspector holding County Fire Safety Inspector certification,
    specialized in manual call point (mcp) loop testing, optical smoke beam detector
    alignment, and fm-200 / novec gas suppression cylinder inspection. Experienced
    in field diagnostics, emergency service restoration, and standard fire alarm &
    fm-200 gas suppression systems procedures.
  - Home Network & Cable Installer holding RF Signal Specialist certification, specialized
    in home wi-fi mesh range extender configuration, cat6 ethernet cable routing and
    wall faceplate termination, and smart tv soundbar and home theater audio calibration.
    Experienced in field diagnostics, emergency service restoration, and standard
    satellite tv, dstv & home wi-fi setup procedures.
- source_sentence: Newly renovated 4-bedroom villa needs complete post-construction
    cleanup. Floor tiles covered in paint splatters and tile grout residue, dusty
    sliding glass doors.
  sentences:
  - Carpet & Upholstery Extraction Specialist holding Floor Restoration Specialist
    certification, specialized in telescopic squeegee high-window washing, sofa fabric
    shampooing and deodorizing, and grout line acid washing and sanitization. Experienced
    in field diagnostics, emergency service restoration, and standard deep house cleaning
    & post-construction scrubbing procedures.
  - Automatic Transfer Switch (ATS) Technician holding DeepSea Electronics Certified
    certification, specialized in ats synchronization panel troubleshooting, fuel
    injection pump calibration, and alternator avr voltage tuning. Experienced in
    field diagnostics, emergency service restoration, and standard standby diesel
    generators & ats changeovers procedures.
  - Physical Security Wireman holding Physical Security Inspector certification, specialized
    in ht wire tensioning and insulator replacement, siren and strobe alarm integration,
    and nemtek / stafix fence line fault finding. Experienced in field diagnostics,
    emergency service restoration, and standard electric fences, razor wire & perimeter
    security procedures.
- source_sentence: Fix loose kitchen cabinet cupboard hinges and re-align sagging
    pantry drawers in residential apartment.
  sentences:
  - Precision Environmental Control Tech holding Refrigerant Handling License certification,
    specialized in electrode steam humidifier maintenance, precision cooling compressor
    replacement, and computer room air conditioning (crac) diagnostics. Experienced
    in field diagnostics, emergency service restoration, and standard data center
    precision cooling & crac (hvac) procedures.
  - Furniture Assembly & Fixture Tech holding Interior Finishing Specialist certification,
    specialized in flat-pack wardrobe and cabinet assembly, heavy-duty tv wall bracket
    installation, and curtain rod and window blind drilling. Experienced in field
    diagnostics, emergency service restoration, and standard general handyman, tv
    mounting & furniture assembly procedures.
  - ZKTeco & Hikvision Certified Tech holding CompTIA Security+ certification, specialized
    in magnetic door lock power supply repair, nvr storage array troubleshooting,
    and video management software (vms) setup. Experienced in field diagnostics, emergency
    service restoration, and standard cctv surveillance & biometric access control
    procedures.
pipeline_tag: sentence-similarity
library_name: sentence-transformers
metrics:
- cosine_accuracy
- cosine_accuracy_threshold
- cosine_f1
- cosine_f1_threshold
- cosine_precision
- cosine_recall
- cosine_ap
- cosine_mcc
model-index:
- name: SentenceTransformer based on sentence-transformers/all-MiniLM-L6-v2
  results:
  - task:
      type: binary-classification
      name: Binary Classification
    dataset:
      name: kenyan field val benchmark
      type: kenyan_field_val_benchmark
    metrics:
    - type: cosine_accuracy
      value: 0.9949152542372881
      name: Cosine Accuracy
    - type: cosine_accuracy_threshold
      value: 0.42380475997924805
      name: Cosine Accuracy Threshold
    - type: cosine_f1
      value: 0.9966024915062288
      name: Cosine F1
    - type: cosine_f1_threshold
      value: 0.42380475997924805
      name: Cosine F1 Threshold
    - type: cosine_precision
      value: 0.9932279909706546
      name: Cosine Precision
    - type: cosine_recall
      value: 1.0
      name: Cosine Recall
    - type: cosine_ap
      value: 0.9941921527090675
      name: Cosine Ap
    - type: cosine_mcc
      value: 0.9865918260107578
      name: Cosine Mcc
---

# SentenceTransformer based on sentence-transformers/all-MiniLM-L6-v2

This is a [sentence-transformers](https://www.SBERT.net) model finetuned from [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). It maps sentences & paragraphs to a 384-dimensional dense vector space and can be used for semantic textual similarity, semantic search, paraphrase mining, classification, clustering, and more.

## Model Details

### Model Description
- **Model Type:** Sentence Transformer
- **Base model:** [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) <!-- at revision 1110a243fdf4706b3f48f1d95db1a4f5529b4d41 -->
- **Maximum Sequence Length:** 256 tokens
- **Output Dimensionality:** 384 dimensions
- **Similarity Function:** Cosine Similarity
- **Supported Modality:** Text
<!-- - **Training Dataset:** Unknown -->
<!-- - **Language:** Unknown -->
<!-- - **License:** Unknown -->

### Model Sources

- **Documentation:** [Sentence Transformers Documentation](https://sbert.net)
- **Repository:** [Sentence Transformers on GitHub](https://github.com/huggingface/sentence-transformers)
- **Hugging Face:** [Sentence Transformers on Hugging Face](https://huggingface.co/models?library=sentence-transformers)

### Full Model Architecture

```
SentenceTransformer(
  (0): Transformer({'transformer_task': 'feature-extraction', 'modality_config': {'text': {'method': 'forward', 'method_output_name': 'last_hidden_state'}}, 'module_output_name': 'token_embeddings', 'architecture': 'BertModel'})
  (1): Pooling({'embedding_dimension': 384, 'pooling_mode': 'mean', 'include_prompt': True})
  (2): Normalize({})
)
```

## Usage

### Direct Usage (Sentence Transformers)

First install the Sentence Transformers library:

```bash
pip install -U sentence-transformers
```
Then you can load this model and run inference.
```python
from sentence_transformers import SentenceTransformer

# Download from the 🤗 Hub
model = SentenceTransformer("sentence_transformers_model_id")
# Run inference
sentences = [
    'Fix loose kitchen cabinet cupboard hinges and re-align sagging pantry drawers in residential apartment.',
    'Furniture Assembly & Fixture Tech holding Interior Finishing Specialist certification, specialized in flat-pack wardrobe and cabinet assembly, heavy-duty tv wall bracket installation, and curtain rod and window blind drilling. Experienced in field diagnostics, emergency service restoration, and standard general handyman, tv mounting & furniture assembly procedures.',
    'ZKTeco & Hikvision Certified Tech holding CompTIA Security+ certification, specialized in magnetic door lock power supply repair, nvr storage array troubleshooting, and video management software (vms) setup. Experienced in field diagnostics, emergency service restoration, and standard cctv surveillance & biometric access control procedures.',
]
embeddings = model.encode(sentences)
print(embeddings.shape)
# [3, 384]

# Get the similarity scores for the embeddings
similarities = model.similarity(embeddings, embeddings)
print(similarities)
# tensor([[1.0000, 0.5641, 0.1193],
#         [0.5641, 1.0000, 0.2005],
#         [0.1193, 0.2005, 1.0000]])
```
<!--
### Direct Usage (Transformers)

<details><summary>Click to see the direct usage in Transformers</summary>

</details>
-->

<!--
### Downstream Usage (Sentence Transformers)

You can finetune this model on your own dataset.

<details><summary>Click to expand</summary>

</details>
-->

<!--
### Out-of-Scope Use

*List how the model may foreseeably be misused and address what users ought not to do with the model.*
-->

## Evaluation

### Metrics

#### Binary Classification

* Dataset: `kenyan_field_val_benchmark`
* Evaluated with [<code>BinaryClassificationEvaluator</code>](https://sbert.net/docs/package_reference/sentence_transformer/evaluation.html#sentence_transformers.sentence_transformer.evaluation.BinaryClassificationEvaluator)

| Metric                    | Value      |
|:--------------------------|:-----------|
| cosine_accuracy           | 0.9949     |
| cosine_accuracy_threshold | 0.4238     |
| cosine_f1                 | 0.9966     |
| cosine_f1_threshold       | 0.4238     |
| cosine_precision          | 0.9932     |
| cosine_recall             | 1.0        |
| **cosine_ap**             | **0.9942** |
| cosine_mcc                | 0.9866     |

<!--
## Bias, Risks and Limitations

*What are the known or foreseeable issues stemming from this model? You could also flag here known failure cases or weaknesses of the model.*
-->

<!--
### Recommendations

*What are recommendations with respect to the foreseeable issues? For example, filtering explicit content.*
-->

## Training Details

### Training Dataset

#### Unnamed Dataset

* Size: 1,760 training samples
* Columns: <code>sentence_0</code> and <code>sentence_1</code>
* Approximate statistics based on the first 100 samples:
  |          | sentence_0                                                                         | sentence_1                                                                         |
  |:---------|:-----------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------|
  | type     | string                                                                             | string                                                                             |
  | modality | text                                                                               | text                                                                               |
  | details  | <ul><li>min: 18 tokens</li><li>mean: 27.06 tokens</li><li>max: 40 tokens</li></ul> | <ul><li>min: 51 tokens</li><li>mean: 67.25 tokens</li><li>max: 80 tokens</li></ul> |
* Samples:
  | sentence_0                                                                                                                                          | sentence_1                                                                                                                                                                                                                                                                                                                                                                                                            |
  |:----------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  | <code>Star-Delta starter contactor in borehole control panel has burned contacts and requires replacement.</code>                                   | <code>Submersible Pump Installation Specialist holding Davis & Shirtliff Certified Technician certification, specialized in borehole yield flow rate testing, submersible borehole pump diagnostics, and water pressure switch calibration. Experienced in field diagnostics, emergency service restoration, and standard borehole & submersible water pumps procedures.</code>                                       |
  | <code>Water heater thermostat failed in closed position, causing geyser tank to overheat water and trip the high-limit thermal cutout.</code>       | <code>Water Heating & Instant Shower Technician holding EPRA Domestic Electrician Class C certification, specialized in shower head descaling and pressure valve regulation, dedicated 20a/32a shower circuit breaker wiring, and pressure-relief safety valve replacement. Experienced in field diagnostics, emergency service restoration, and standard domestic water heating & instant showers procedures.</code> |
  | <code>Just purchased a 4-door modular wardrobe from furniture store; need on-site assembly of drawers, hanging rails, and soft-close hinges.</code> | <code>Residential Carpentry & Mounting Specialist holding Carpentry & Joinery Trade Test certification, specialized in mortise door lock and handle replacement, gypsum hollow-wall butterfly anchor mounting, and heavy-duty tv wall bracket installation. Experienced in field diagnostics, emergency service restoration, and standard general handyman, tv mounting & furniture assembly procedures.</code>       |
* Loss: [<code>MultipleNegativesRankingLoss</code>](https://sbert.net/docs/package_reference/sentence_transformer/losses.html#multiplenegativesrankingloss) with these parameters:
  ```json
  {
      "scale": 20.0,
      "similarity_fct": "cos_sim",
      "gather_across_devices": false,
      "directions": [
          "query_to_doc"
      ],
      "partition_mode": "joint",
      "hardness_mode": null,
      "hardness_strength": 0.0
  }
  ```

### Training Hyperparameters
#### Non-Default Hyperparameters

- `per_device_train_batch_size`: 16
- `num_train_epochs`: 4
- `per_device_eval_batch_size`: 16
- `multi_dataset_batch_sampler`: round_robin

#### All Hyperparameters
<details><summary>Click to expand</summary>

- `per_device_train_batch_size`: 16
- `num_train_epochs`: 4
- `max_steps`: -1
- `learning_rate`: 5e-05
- `lr_scheduler_type`: linear
- `lr_scheduler_kwargs`: None
- `warmup_steps`: 0
- `optim`: adamw_torch_fused
- `optim_args`: None
- `weight_decay`: 0.0
- `adam_beta1`: 0.9
- `adam_beta2`: 0.999
- `adam_epsilon`: 1e-08
- `optim_target_modules`: None
- `gradient_accumulation_steps`: 1
- `average_tokens_across_devices`: True
- `max_grad_norm`: 1
- `label_smoothing_factor`: 0.0
- `bf16`: False
- `fp16`: False
- `bf16_full_eval`: False
- `fp16_full_eval`: False
- `tf32`: None
- `gradient_checkpointing`: False
- `gradient_checkpointing_kwargs`: None
- `torch_compile`: False
- `torch_compile_backend`: None
- `torch_compile_mode`: None
- `use_liger_kernel`: False
- `liger_kernel_config`: None
- `use_cache`: False
- `neftune_noise_alpha`: None
- `torch_empty_cache_steps`: None
- `auto_find_batch_size`: False
- `log_on_each_node`: True
- `logging_nan_inf_filter`: True
- `include_num_input_tokens_seen`: no
- `log_level`: passive
- `log_level_replica`: warning
- `disable_tqdm`: False
- `project`: huggingface
- `trackio_space_id`: None
- `trackio_bucket_id`: None
- `trackio_static_space_id`: None
- `per_device_eval_batch_size`: 16
- `prediction_loss_only`: True
- `eval_on_start`: False
- `eval_do_concat_batches`: True
- `eval_use_gather_object`: False
- `eval_accumulation_steps`: None
- `include_for_metrics`: []
- `batch_eval_metrics`: False
- `save_only_model`: False
- `save_on_each_node`: False
- `enable_jit_checkpoint`: False
- `push_to_hub`: False
- `hub_private_repo`: None
- `hub_model_id`: None
- `hub_strategy`: every_save
- `hub_always_push`: False
- `hub_revision`: None
- `load_best_model_at_end`: False
- `ignore_data_skip`: False
- `restore_callback_states_from_checkpoint`: False
- `full_determinism`: False
- `seed`: 42
- `data_seed`: None
- `use_cpu`: False
- `accelerator_config`: {'split_batches': False, 'dispatch_batches': None, 'even_batches': True, 'use_seedable_sampler': True, 'non_blocking': False, 'gradient_accumulation_kwargs': None}
- `parallelism_config`: None
- `dataloader_drop_last`: False
- `dataloader_num_workers`: 0
- `dataloader_pin_memory`: True
- `dataloader_persistent_workers`: False
- `dataloader_prefetch_factor`: None
- `dataloader_multiprocessing_context`: None
- `dataloader_in_order`: True
- `remove_unused_columns`: True
- `label_names`: None
- `train_sampling_strategy`: random
- `length_column_name`: length
- `ddp_find_unused_parameters`: None
- `ddp_bucket_cap_mb`: None
- `ddp_broadcast_buffers`: False
- `ddp_static_graph`: None
- `ddp_backend`: None
- `ddp_timeout`: 1800
- `fsdp`: None
- `fsdp_config`: None
- `deepspeed`: None
- `debug`: []
- `skip_memory_metrics`: True
- `do_predict`: False
- `resume_from_checkpoint`: None
- `local_rank`: -1
- `prompts`: None
- `batch_sampler`: batch_sampler
- `multi_dataset_batch_sampler`: round_robin
- `router_mapping`: {}
- `learning_rate_mapping`: {}
- `warmup_ratio`: None

</details>

### Training Logs
| Epoch | Step | kenyan_field_val_benchmark_cosine_ap |
|:-----:|:----:|:------------------------------------:|
| -1    | -1   | 0.9738                               |
| 1.0   | 110  | 0.9922                               |
| 2.0   | 220  | 0.9932                               |
| 3.0   | 330  | 0.9942                               |
| 4.0   | 440  | 0.9942                               |


### Training Time
- **Training**: 33.5 seconds

### Framework Versions
- Python: 3.13.16
- Sentence Transformers: 5.7.0
- Transformers: 5.20.2
- PyTorch: 2.11.0+cu130
- Accelerate: 1.15.0
- Datasets: 4.8.5
- Tokenizers: 0.23.3

## Additional Resources

- [Training and Finetuning Embedding Models with Sentence Transformers](https://huggingface.co/blog/train-sentence-transformers): the end-to-end guide for training or finetuning Sentence Transformer models.
- [Introduction to Matryoshka Embedding Models](https://huggingface.co/blog/matryoshka): variable-size embeddings that can be truncated with minimal quality loss.
- [Binary and Scalar Embedding Quantization for Significantly Faster & Cheaper Retrieval](https://huggingface.co/blog/embedding-quantization): post-training compression of embedding vectors.
- [Multimodal Embedding & Reranker Models with Sentence Transformers](https://huggingface.co/blog/multimodal-sentence-transformers): use text, image, audio, and video models through the same API.
- [Training and Finetuning Multimodal Embedding & Reranker Models with Sentence Transformers](https://huggingface.co/blog/train-multimodal-sentence-transformers): train multimodal embedding models, with a Visual Document Retrieval walkthrough.

## Citation

### BibTeX

#### Sentence Transformers
```bibtex
@inproceedings{reimers-2019-sentence-bert,
    title = "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks",
    author = "Reimers, Nils and Gurevych, Iryna",
    booktitle = "Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing",
    month = "11",
    year = "2019",
    publisher = "Association for Computational Linguistics",
    url = "https://arxiv.org/abs/1908.10084",
}
```

#### MultipleNegativesRankingLoss
```bibtex
@misc{oord2019representationlearningcontrastivepredictive,
      title={Representation Learning with Contrastive Predictive Coding},
      author={Aaron van den Oord and Yazhe Li and Oriol Vinyals},
      year={2019},
      eprint={1807.03748},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/1807.03748},
}
```

<!--
## Glossary

*Clearly define terms in order to be accessible across audiences.*
-->

<!--
## Model Card Authors

*Lists the people who create the model card, providing recognition and accountability for the detailed work that goes into its construction.*
-->

<!--
## Model Card Contact

*Provides a way for people who have updates to the Model Card, suggestions, or questions, to contact the Model Card authors.*
-->