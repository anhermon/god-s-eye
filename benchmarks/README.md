# Gods Eye Benchmark Suite

Measures build quality and code health for the Gods Eye (WorldView OSS) dashboard.

## Metrics

| Metric | Weight | Description |
|---|---|---|
| `typecheck_pass` | 30% | TypeScript compilation with `tsc --noEmit` |
| `lint_clean` | 20% | ESLint passes with zero errors |
| `build_success` | 35% | `next build` completes successfully |
| `build_time` | 15% | Build duration (<=120s = 1.0, >=600s = 0.0, linear between) |

Additional informational metrics (not scored): `ts_file_count`, `ts_loc`, `build_time_raw`.

## Running

```bash
# From repo root
bash benchmarks/run.sh
```

Results are written to `benchmark-results.json` in the repo root.

## Pass criteria

The benchmark passes (exit 0) when the weighted overall score is >= 0.7.
It fails (exit 1) otherwise.

## CI

The GitHub Actions workflow at `.github/workflows/ci.yml` runs this benchmark on every push and PR to `main` and `dev`, and uploads `benchmark-results.json` as an artifact.
