"""FastAPI endpoints for EcoPyCSim parameter metadata."""

from __future__ import annotations

import logging
from copy import deepcopy
from typing import Any, Literal, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
  from .param_registry import get_defaults
except ImportError:  # pragma: no cover - supports running from EcoPyCSim cwd.
  from param_registry import get_defaults


logger = logging.getLogger(__name__)


UI_CONSTRAINTS = {
  "episodes": {"min": 1, "max": 10000, "step": 1},
  "memory_size": {"min": 1000, "max": 1000000, "step": 1000},
  "batch_size": {"min": 1, "max": 8192, "step": 1},
  "random_steps_factor": {"min": 0, "max": 1, "step": 0.01},
  "critic_lr": {"min": 1e-6, "max": 0.1, "step": 1e-6},
  "actor_lr": {"min": 1e-6, "max": 0.1, "step": 1e-6},
  "discount_factor": {"min": 0, "max": 1, "step": 0.01},
  "target_update_steps": {"min": 1, "max": 100, "step": 1},
  "tau": {"min": 0, "max": 1, "step": 0.01},
  "n_jobs": {"min": 1, "max": 10000, "step": 1},
  "n_tasks": {"min": 1, "max": 100000, "step": 1},
  "n_server_farms": {"min": 1, "max": 100, "step": 1},
  "n_servers": {"min": 1, "max": 10000, "step": 1},
  "job_arrival_lambda": {"min": 1e-6, "max": 10, "step": 0.01},
  "task_arrival_mu": {"min": 0, "max": 100, "step": 0.1},
  "task_arrival_sigma2": {"min": 0, "max": 100, "step": 0.1},
  "cpu_range": {"min": 0, "max": 1, "step": 0.01},
  "ram_range": {"min": 0, "max": 1, "step": 0.01},
  "n_vm_types": {"min": 1, "max": 100, "step": 1},
  "alpha_range": {"min": 0, "max": 1, "step": 0.01},
  "beta": {"min": 0, "max": 100, "step": 1},
  "optimal_util_rate": {"min": 0, "max": 1, "step": 0.01},
  "static_power": {"min": 0, "max": 1, "step": 0.001},
}


class ParamFieldModel(BaseModel):
  value: Any = Field(..., description="Current parameter value or allowed values.")
  label: str = Field(..., description="Human-readable label for dashboard controls.")
  type: Literal["float", "int", "str", "list"] = Field(..., description="Frontend rendering type.")
  editable: bool = Field(..., description="Whether the frontend should allow user edits.")
  min: Optional[float] = Field(None, description="Minimum slider/input value for editable numeric fields.")
  max: Optional[float] = Field(None, description="Maximum slider/input value for editable numeric fields.")
  step: Optional[float] = Field(None, description="Slider/input step for editable numeric fields.")


class MADDPGHyperparamsModel(BaseModel):
  episodes: ParamFieldModel
  n_agents: ParamFieldModel
  network_layers: ParamFieldModel
  memory_size: ParamFieldModel
  batch_size: ParamFieldModel
  random_steps_factor: ParamFieldModel
  critic_lr: ParamFieldModel
  actor_lr: ParamFieldModel
  discount_factor: ParamFieldModel
  target_update_steps: ParamFieldModel
  optimizer: ParamFieldModel
  tau: ParamFieldModel


class SimulationParamsModel(BaseModel):
  n_jobs: ParamFieldModel
  n_tasks: ParamFieldModel
  n_server_farms: ParamFieldModel
  n_servers: ParamFieldModel
  job_arrival_lambda: ParamFieldModel
  task_arrival_mu: ParamFieldModel
  task_arrival_sigma2: ParamFieldModel
  cpu_range: ParamFieldModel
  ram_range: ParamFieldModel
  n_vm_types: ParamFieldModel
  alpha_range: ParamFieldModel
  beta: ParamFieldModel
  optimal_util_rate: ParamFieldModel
  static_power: ParamFieldModel


class ParamsBundleModel(BaseModel):
  hyperparameters: MADDPGHyperparamsModel
  simulation: SimulationParamsModel


class ValidationErrorItem(BaseModel):
  field: str
  message: str


class ValidationResponse(BaseModel):
  valid: bool
  errors: list[ValidationErrorItem]


app = FastAPI(
  title="EcoPyCSim Parameter API",
  description="REST metadata endpoints for EcoPyCSim dashboard parameter controls.",
  version="0.1.0",
  openapi_tags=[
    {
      "name": "Hyperparameters",
      "description": "MADDPG Table 2 parameter metadata and validation.",
    },
    {
      "name": "Simulation Parameters",
      "description": "CloudSchedulingEnv Table 3 parameter metadata and validation.",
    },
  ],
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.on_event("startup")
def log_param_sources() -> None:
  """Log parameter source coverage without starting a simulation instance."""
  defaults = get_defaults()
  default_fields = {
    section: sorted(params.keys())
    for section, params in defaults.items()
  }
  default_count = sum(len(fields) for fields in default_fields.values())

  logger.info("Parameter API startup: live simulation loading is disabled for this process.")
  logger.info("Loaded 0 params from live simulation and %s params from defaults.", default_count)
  logger.info("Default param fields loaded: %s", default_fields)


@app.get(
  "/params/defaults",
  response_model=ParamsBundleModel,
  tags=["Hyperparameters", "Simulation Parameters"],
)
def get_param_defaults() -> dict:
  """Return Table 2 and Table 3 metadata for rendering dashboard controls before a run exists."""
  return _with_ui_constraints(get_defaults())


@app.post(
  "/params/validate",
  response_model=ValidationResponse,
  responses={422: {"model": ValidationResponse}},
  tags=["Hyperparameters", "Simulation Parameters"],
)
def validate_params(params: ParamsBundleModel) -> ValidationResponse | JSONResponse:
  """Validate edited dashboard parameters before the frontend submits a simulation run request."""
  payload = _model_dump(params)
  errors = _validate_payload(payload)
  response = ValidationResponse(valid=not errors, errors=errors)
  if errors:
    return JSONResponse(status_code=422, content=_model_dump(response))
  return response


@app.get(
  "/params/schema",
  tags=["Hyperparameters", "Simulation Parameters"],
)
def get_param_schema() -> dict:
  """Return JSON Schema for frontend form generation and client-side type hints."""
  return {
    "hyperparameters": _model_schema(MADDPGHyperparamsModel),
    "simulation": _model_schema(SimulationParamsModel),
    "bundle": _model_schema(ParamsBundleModel),
  }


def _with_ui_constraints(params: dict) -> dict:
  enriched = deepcopy(params)
  for section in ("hyperparameters", "simulation"):
    for field_name, field_meta in enriched.get(section, {}).items():
      if not field_meta.get("editable"):
        continue
      constraints = UI_CONSTRAINTS.get(field_name)
      if constraints:
        field_meta.update(constraints)
  return enriched


def _validate_payload(payload: dict) -> list[ValidationErrorItem]:
  errors: list[ValidationErrorItem] = []

  _validate_numeric_range(
    payload,
    errors,
    "hyperparameters",
    "episodes",
    min_value=1,
    max_value=10000,
    integer=True,
    message="episodes must be an integer between 1 and 10000",
  )
  for field_name in ("critic_lr", "actor_lr"):
    _validate_numeric_range(
      payload,
      errors,
      "hyperparameters",
      field_name,
      min_value=1e-6,
      max_value=0.1,
      message=f"{field_name} must be between 1e-6 and 0.1",
    )
  _validate_power_of_two(payload, errors, "hyperparameters", "batch_size")
  _validate_numeric_range(
    payload,
    errors,
    "hyperparameters",
    "tau",
    min_value=0,
    max_value=1,
    message="tau must be between 0 and 1",
  )
  _validate_numeric_range(
    payload,
    errors,
    "hyperparameters",
    "discount_factor",
    min_value=0,
    max_value=1,
    message="discount_factor must be between 0 and 1",
  )
  _validate_server_divisibility(payload, errors)

  return errors


def _validate_numeric_range(
  payload: dict,
  errors: list[ValidationErrorItem],
  section: str,
  field_name: str,
  *,
  min_value: float,
  max_value: float,
  message: str,
  integer: bool = False,
) -> None:
  value = _param_value(payload, section, field_name)
  if isinstance(value, list):
    return

  number = _as_number(value)
  if number is None:
    errors.append(ValidationErrorItem(field=f"{section}.{field_name}", message=f"{field_name} must be numeric"))
    return

  if integer and int(number) != number:
    errors.append(ValidationErrorItem(field=f"{section}.{field_name}", message=message))
    return

  if number < min_value or number > max_value:
    errors.append(ValidationErrorItem(field=f"{section}.{field_name}", message=message))


def _validate_power_of_two(
  payload: dict,
  errors: list[ValidationErrorItem],
  section: str,
  field_name: str,
) -> None:
  value = _param_value(payload, section, field_name)
  if isinstance(value, list):
    return

  number = _as_number(value)
  if number is None or int(number) != number:
    errors.append(ValidationErrorItem(field=f"{section}.{field_name}", message="batch_size must be an integer"))
    return

  batch_size = int(number)
  if batch_size < 1 or batch_size & (batch_size - 1):
    errors.append(ValidationErrorItem(field=f"{section}.{field_name}", message="batch_size must be a power of 2"))


def _validate_server_divisibility(payload: dict, errors: list[ValidationErrorItem]) -> None:
  n_servers = _param_value(payload, "simulation", "n_servers")
  n_server_farms = _param_value(payload, "simulation", "n_server_farms")
  if isinstance(n_servers, list) or isinstance(n_server_farms, list):
    return

  servers = _as_number(n_servers)
  farms = _as_number(n_server_farms)
  if servers is None or farms is None:
    errors.append(
      ValidationErrorItem(
        field="simulation.n_servers",
        message="n_servers and n_server_farms must be numeric",
      )
    )
    return

  servers = int(servers)
  farms = int(farms)
  if farms < 1:
    errors.append(
      ValidationErrorItem(
        field="simulation.n_server_farms",
        message="n_server_farms must be at least 1",
      )
    )
    return

  if servers % farms != 0:
    errors.append(
      ValidationErrorItem(
        field="simulation.n_servers",
        message="n_servers must be divisible by n_server_farms",
      )
    )


def _param_value(payload: dict, section: str, field_name: str) -> Any:
  field = payload.get(section, {}).get(field_name, {})
  if isinstance(field, dict):
    return field.get("value")
  return field


def _as_number(value: Any) -> Optional[float]:
  if isinstance(value, bool):
    return None
  try:
    return float(value)
  except (TypeError, ValueError):
    return None


def _model_dump(model: BaseModel) -> dict:
  if hasattr(model, "model_dump"):
    return model.model_dump()
  return model.dict()


def _model_schema(model: type[BaseModel]) -> dict:
  if hasattr(model, "model_json_schema"):
    return model.model_json_schema()
  return model.schema()


__all__ = ["app"]
