from datetime import timedelta

from django.conf import settings

from temporalio.client import (
    Client,
    Schedule,
    ScheduleActionStartWorkflow,
    ScheduleCalendarSpec,
    ScheduleIntervalSpec,
    ScheduleOverlapPolicy,
    SchedulePolicy,
    ScheduleRange,
    ScheduleSpec,
)

from posthog.temporal.common.schedule import a_create_schedule, a_schedule_exists, a_update_schedule

from products.error_tracking.backend.temporal.types import SpikeEventCleanupInputs, SymbolSetCleanupInputs
from products.error_tracking.backend.temporal.workflow import SPIKE_EVENT_CLEANUP_WORKFLOW_NAME, WORKFLOW_NAME

SCHEDULE_ID = "error-tracking-symbol-set-cleanup-schedule"
SCHEDULE_INTERVAL = timedelta(hours=1)
SPIKE_EVENT_CLEANUP_SCHEDULE_ID = "error-tracking-spike-event-cleanup-schedule"


async def create_error_tracking_symbol_set_cleanup_schedule(client: Client) -> None:
    symbol_set_cleanup_schedule = Schedule(
        action=ScheduleActionStartWorkflow(
            WORKFLOW_NAME,
            SymbolSetCleanupInputs(),
            id=SCHEDULE_ID,
            task_queue=settings.ERROR_TRACKING_TASK_QUEUE,
        ),
        spec=ScheduleSpec(intervals=[ScheduleIntervalSpec(every=SCHEDULE_INTERVAL)]),
        policy=SchedulePolicy(overlap=ScheduleOverlapPolicy.SKIP, catchup_window=SCHEDULE_INTERVAL),
    )

    if await a_schedule_exists(client, SCHEDULE_ID):
        await a_update_schedule(client, SCHEDULE_ID, symbol_set_cleanup_schedule)
    else:
        await a_create_schedule(client, SCHEDULE_ID, symbol_set_cleanup_schedule, trigger_immediately=False)


async def create_error_tracking_spike_event_cleanup_schedule(client: Client) -> None:
    spike_event_cleanup_schedule = Schedule(
        action=ScheduleActionStartWorkflow(
            SPIKE_EVENT_CLEANUP_WORKFLOW_NAME,
            SpikeEventCleanupInputs(),
            id=SPIKE_EVENT_CLEANUP_SCHEDULE_ID,
            task_queue=settings.ERROR_TRACKING_TASK_QUEUE,
        ),
        spec=ScheduleSpec(
            calendars=[
                ScheduleCalendarSpec(
                    comment="Daily at 4 AM UTC",
                    hour=[ScheduleRange(start=4, end=4)],
                )
            ]
        ),
        policy=SchedulePolicy(overlap=ScheduleOverlapPolicy.SKIP, catchup_window=timedelta(days=1)),
    )

    if await a_schedule_exists(client, SPIKE_EVENT_CLEANUP_SCHEDULE_ID):
        await a_update_schedule(client, SPIKE_EVENT_CLEANUP_SCHEDULE_ID, spike_event_cleanup_schedule)
    else:
        await a_create_schedule(
            client,
            SPIKE_EVENT_CLEANUP_SCHEDULE_ID,
            spike_event_cleanup_schedule,
            trigger_immediately=False,
        )
