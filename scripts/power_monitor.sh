#!/usr/bin/env bash
# Captura potencia (W), VRAM alocada (MB) e temperatura (°C) da GPU via
# nvidia-smi a 1Hz.
# Output: CSV com timestamp,watts,vram_mb,temp_c
# Usage: bash scripts/power_monitor.sh > resultados/power_log.csv

INTERVAL=1

echo "timestamp,watts,vram_mb,temp_c"
while true; do
  LEITURA=$(nvidia-smi --query-gpu=power.draw,memory.used,temperature.gpu --format=csv,noheader,nounits | tr -d ' ')
  echo "$(date +%s),$LEITURA"
  sleep "$INTERVAL"
done
