#!/usr/bin/env bash
# Capture GPU power draw (Watts) via nvidia-smi at 1-second intervals.
# Output: CSV with timestamp,watts
# Usage: bash scripts/power_monitor.sh > resultados/power_log.csv

INTERVAL=1

echo "timestamp,watts"
while true; do
  WATTS=$(nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits | tr -d ' ')
  echo "$(date +%s),$WATTS"
  sleep "$INTERVAL"
done
