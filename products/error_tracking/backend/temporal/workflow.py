import json
from datetime import timedelta

from temporalio import common, workflow

from posthog.temporal.common.base import PostHogWorkflow

with workflow.unsafe.imports_passed_through():
    from products.error_tracking.backend.temporal.activities import (
        cleanup_spike_events_activity,
        cleanup_symbol_sets_activity,
    )
    from products.error_tracking.backend.temporal.types import (
        SpikeEventCleanupInputs,
        SpikeEventCleanupResult,
        SymbolSetCleanupInputs,
        SymbolSetCleanupResult,
    )

WORKFLOW_NAME = "error-tracking-symbol-set-cleanup"
SPIKE_EVENT_CLEANUP_WORKFLOW_NAME = "error-tracking-spike-event-cleanup"

ACTIVITY_RETRY_POLICY = common.RetryPolicy(maximum_attempts=1)
ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(hours=2)


@workflow.defn(name=WORKFLOW_NAME)
class ErrorTrackingSymbolSetCleanupWorkflow(PostHogWorkflow):
    @staticmethod
    def parse_inputs(inputs: list[str]) -> SymbolSetCleanupInputs:
        if inputs:
            data = json.loads(inputs[0])
            return SymbolSetCleanupInputs(**data)
        return SymbolSetCleanupInputs()

    @workflow.run
    async def run(self, inputs: SymbolSetCleanupInputs | None = None) -> SymbolSetCleanupResult:
        if inputs is None:
            inputs = SymbolSetCleanupInputs()

        return await workflow.execute_activity(
            cleanup_symbol_sets_activity,
            inputs,
            start_to_close_timeout=ACTIVITY_START_TO_CLOSE_TIMEOUT,
            retry_policy=ACTIVITY_RETRY_POLICY,
        )


@workflow.defn(name=SPIKE_EVENT_CLEANUP_WORKFLOW_NAME)
class ErrorTrackingSpikeEventCleanupWorkflow(PostHogWorkflow):
    @staticmethod
    def parse_inputs(inputs: list[str]) -> SpikeEventCleanupInputs:
        if inputs:
            data = json.loads(inputs[0])
            return SpikeEventCleanupInputs(**data)
        return SpikeEventCleanupInputs()

    @workflow.run
    async def run(self, inputs: SpikeEventCleanupInputs | None = None) -> SpikeEventCleanupResult:
        if inputs is None:
            inputs = SpikeEventCleanupInputs()

        return await workflow.execute_activity(
            cleanup_spike_events_activity,
            inputs,
            start_to_close_timeout=ACTIVITY_START_TO_CLOSE_TIMEOUT,
            retry_policy=ACTIVITY_RETRY_POLICY,
        )
