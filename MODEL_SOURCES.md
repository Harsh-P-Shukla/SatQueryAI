# Public baseline and the NabhSetu research deck

The supplied six-slide `NabhSetu_SIH26167_Idea_SIHFormat (1) (2) (2).pptx` is a proposal, not model weights or executable configuration. The user selected getting existing SatQuery AI working with public Qwen + YOLO first. PostgreSQL and the React/Express/FastAPI architecture are retained.

## Selected runtime

| Component | Selected source | Role |
| --- | --- | --- |
| Qwen2.5-VL-3B-Instruct | https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct | Base RGB captioning and VQA, approximately 7.52 GB download; loaded in NF4 on NVIDIA GPU |
| YOLO11x-OBB | https://github.com/ultralytics/assets/releases/download/v8.4.0/yolo11x-obb.pt | DOTA oriented object detection; 118438668 bytes; CPU inference to preserve GPU memory |
| PEFT / bitsandbytes | https://huggingface.co/docs/peft/ and https://huggingface.co/docs/bitsandbytes/ | Original-adapter support and 4-bit quantization; no newly trained adapters |
| PyTorch CUDA 12.8 | https://pytorch.org/get-started/previous-versions/ | Blackwell-compatible runtime, verified on RTX 5050 |

YOLO's downloaded SHA-256 exactly matches the original repository's pointer: `1461342db1ce0f35c755278303febd1174604ccc375110076fa0ac155231b6a0`. It is stored separately in ignored `.cache/models` so the source pointers remain intact.

Public mode does not load the missing DIOR detector or custom caption/VQA/SAR/IR adapters. It does not claim equivalent domain accuracy. Model output quality needs task-specific evaluation; a smoke test establishes working execution, not benchmark accuracy. Public mode handles ordinary RGB renderings, not scientific interpretation of raw radar/multispectral measurements.

## References retained for later phases, not installed as app features

| Reference | What it provides | Why it is outside this setup |
| --- | --- | --- |
| [CROMA](https://github.com/antofuller/CROMA) | Pretrained radar/optical encoders | Needs two-channel Sentinel-1 and twelve-channel Sentinel-2 inputs, preprocessing and downstream trained heads; current app accepts a single RGB image |
| [ChangeFormer](https://github.com/wgcban/ChangeFormer) / [BIT](https://github.com/justchenhao/BIT_CD) | Bi-temporal change detection models | Need paired-date uploads, alignment validation, change-output integration and appropriate checkpoints |
| [BigEarthNet.txt](https://txt.bigearth.net/) | Paired Sentinel imagery/text dataset | Training/evaluation resource; not an inference dependency |
| [VRSBench](https://vrsbench.github.io/) | Remote-sensing caption, QA and grounding benchmark | Training/evaluation resource; does not reconstruct SatQuery AI's unpublished fine-tuning weights |
| [RSVQA](https://arxiv.org/abs/2003.07333) | Low/high-resolution image-question-answer datasets | Training/evaluation, not an installable replacement model |
| [CDVQA](https://arxiv.org/abs/2112.06343) | Change-detection VQA research/dataset | Requires a separate temporal workflow and trained QA model |
| LoRA / QLoRA | Adaptation/training methods | Installing PEFT does not create the original learned weights |

No bulk training datasets, CROMA, ChangeFormer/BIT, geospatial toolchain, SQLite replacement, or six-task router were added. Those are the proposal's later implementation phases, not completed functionality of this baseline.
