# Fraud Training Dataset Schema

Use `fraud_training_schema.csv` as the baseline tabular dataset shape for:

- `XGBoost` or `LightGBM` fraud classification
- `Isolation Forest` anomaly scoring

## Core Features

- `account_age_months`
- `profile_complete`
- `followers`
- `following`
- `posts`
- `duplicate_identity_score`
- `suspicious_login_score`
- `linked_profile_count`
- `ip_device_variation`

## Derived Engine Features

- `deterministic_trust_score`
- `fake_engine_trust_score`
- `fused_trust_score`

## Label

- `is_fake_label`
  - `1` means fake / malicious / high-confidence abusive
  - `0` means normal / genuine / low-risk

## Notes

- Train `XGBoost` or `LightGBM` on the full feature set above.
- Train `Isolation Forest` on the same feature columns but without the label.
- Keep `topFeatures` and `topSignals` mapped back to these column names so the UI can explain results consistently.
