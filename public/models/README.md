# Self-hosted models

The meaning checker loads its embedding model from here instead of the Hugging Face CDN
(see `src/lib/embedder.worker.js`).

`Xenova/all-MiniLM-L6-v2/` holds only the files the app uses, at revision
`751bff37182d3f1213fa05d7196b954e230abad9`:

- `config.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `onnx/model_quantized.onnx` (sha256 `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1`)

To update, download the same files for a new revision from
`https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/<revision>/<file>`.
