"""Display-name helpers for run history entries and saved models.

Run history and model lists are stored newest-first, but display numbering is
chronological: the oldest entry is number 1.
"""

from typing import Any

from ecopycsim_api.config import EVALUATION_DISPLAY_PREFIXES


def get_evaluation_display_prefix(run_type_label: str | None) -> str | None:
  return EVALUATION_DISPLAY_PREFIXES.get(run_type_label or '')


def with_evaluation_display_names(run_history: list[dict[str, Any]]) -> list[dict[str, Any]]:
  counts = {run_type: 0 for run_type in EVALUATION_DISPLAY_PREFIXES}
  named_entries: list[dict[str, Any]] = []

  for entry in reversed(run_history):
    prefix = get_evaluation_display_prefix(entry.get('type'))

    if prefix and entry.get('evaluationResults'):
      counts[entry['type']] += 1
      entry = {
        **entry,
        'displayName': entry.get('displayName') or f"{prefix}-{counts[entry['type']]}",
      }

    named_entries.append(entry)

  named_entries.reverse()
  return named_entries


def get_next_evaluation_display_name(
  run_history: list[dict[str, Any]],
  run_type_label: str,
) -> str | None:
  prefix = get_evaluation_display_prefix(run_type_label)

  if not prefix:
    return None

  completed_count = sum(
    1
    for entry in run_history
    if entry.get('type') == run_type_label and entry.get('evaluationResults')
  )
  return f'{prefix}-{completed_count + 1}'


def with_simple_model_names(models: list[dict[str, Any]]) -> list[dict[str, Any]]:
  total = len(models)
  return [
    {
      **model,
      'name': model.get('name')
      if str(model.get('name', '')).startswith('Model ')
      else f'Model {total - position}',
    }
    for position, model in enumerate(models)
  ]


def get_next_model_name(models: list[dict[str, Any]]) -> str:
  return f'Model {len(models) + 1}'


def public_model(model: dict[str, Any]) -> dict[str, Any]:
  return {key: value for key, value in model.items() if key != 'modelPath'}
