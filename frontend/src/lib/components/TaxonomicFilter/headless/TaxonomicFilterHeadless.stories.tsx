import { Meta, StoryObj } from '@storybook/react'
import { useMountedLogic } from 'kea'
import { useState } from 'react'

import { taxonomicFilterMocksDecorator } from 'lib/components/TaxonomicFilter/__mocks__/taxonomicFilterMocksDecorator'

import { actionsModel } from '~/models/actionsModel'

import { __clearTaxonomicResourceCache } from '../hooks/useTaxonomicResource'
import { recentTaxonomicFiltersLogic } from '../recentTaxonomicFiltersLogic'
import { TaxonomicFilterGroup, TaxonomicFilterGroupType, TaxonomicFilterValue } from '../types'
import { TaxonomicFilterHeadless } from './index'

interface SeedRecent {
    groupType: TaxonomicFilterGroupType
    groupName: string
    value: string
}

const meta: Meta = {
    title: 'Filters/Taxonomic Filter (Headless)',
    decorators: [taxonomicFilterMocksDecorator],
    parameters: {
        docs: {
            description: {
                component:
                    'Headless TaxonomicFilter built on Quill primitives. The compound `<Root>/<Input>/<Categories>/<Panel>` API is opt-in via the `TAXONOMIC_FILTER_HEADLESS` feature flag and replaces the kea-based `<TaxonomicFilter>` once parity is verified.',
            },
        },
    },
    tags: ['autodocs'],
}

export default meta

type Story = StoryObj

interface ContainerArgs {
    taxonomicGroupTypes: TaxonomicFilterGroupType[]
    initialSearchQuery?: string
    suggestedFiltersLabel?: string
    seedRecents?: SeedRecent[]
}

function Container({
    taxonomicGroupTypes,
    initialSearchQuery,
    suggestedFiltersLabel,
    seedRecents,
}: ContainerArgs): JSX.Element {
    useMountedLogic(actionsModel)
    const recentLogic = useMountedLogic(recentTaxonomicFiltersLogic)
    useState(() => {
        __clearTaxonomicResourceCache()
        // Seed deterministic recents so the Suggested tab renders them in the
        // snapshot. Recorded oldest-first; the reducer prepends, so the last
        // entry leads.
        recentLogic.actions.clearRecentFilters()
        for (const recent of seedRecents ?? []) {
            recentLogic.actions.recordRecentFilter({
                groupType: recent.groupType,
                groupName: recent.groupName,
                value: recent.value,
                item: { name: recent.value },
            })
        }
        return null
    })
    const [lastPick, setLastPick] = useState<{
        group: string
        value: TaxonomicFilterValue | null
        name?: string
    } | null>(null)

    return (
        <div className="flex flex-col gap-3 max-w-xl border rounded p-3 bg-surface-primary">
            <TaxonomicFilterHeadless.Root
                taxonomicGroupTypes={taxonomicGroupTypes}
                initialSearchQuery={initialSearchQuery}
                suggestedFiltersLabel={suggestedFiltersLabel}
                onChange={(group: TaxonomicFilterGroup, value, item: any) => {
                    setLastPick({ group: group.type, value, name: item?.name })
                }}
            >
                <TaxonomicFilterHeadless.Input />
                <TaxonomicFilterHeadless.Categories className="flex flex-row flex-wrap gap-1" />
                <TaxonomicFilterHeadless.Panel className="max-h-80 overflow-auto" />
            </TaxonomicFilterHeadless.Root>
            {lastPick && (
                <div className="text-xs text-secondary">
                    Selected: <code>{lastPick.group}</code> / <code>{String(lastPick.value)}</code>
                    {lastPick.name ? ` (${lastPick.name})` : ''}
                </div>
            )}
        </div>
    )
}

export const EventsAndActions: Story = {
    render: () => (
        <Container taxonomicGroupTypes={[TaxonomicFilterGroupType.Events, TaxonomicFilterGroupType.Actions]} />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Two tabs: Events + Actions. Tab strip uses Quill `<Button>`, list uses `<ItemMenuItem>`.',
            },
        },
    },
}

export const Properties: Story = {
    render: () => (
        <Container
            taxonomicGroupTypes={[TaxonomicFilterGroupType.EventProperties, TaxonomicFilterGroupType.PersonProperties]}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Property picker — Event + Person properties. Uses the same headless API as the Events story.',
            },
        },
    },
}

export const SuggestedFiltersWithRecents: Story = {
    render: () => (
        <Container
            taxonomicGroupTypes={[
                TaxonomicFilterGroupType.SuggestedFilters,
                TaxonomicFilterGroupType.Events,
                TaxonomicFilterGroupType.EventProperties,
            ]}
            suggestedFiltersLabel="Top picks"
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates the auto-injected SuggestedFilters tab + a custom label.',
            },
        },
    },
}

export const SuggestedIsDefaultSurface: Story = {
    render: () => (
        <Container taxonomicGroupTypes={[TaxonomicFilterGroupType.Events, TaxonomicFilterGroupType.EventProperties]} />
    ),
    parameters: {
        docs: {
            description: {
                story: 'The caller requests Events + Event properties and does NOT ask for SuggestedFilters — but because more than one content group is requested, the Suggested tab is auto-injected as the first tab and is the default active surface. Single-purpose pickers (one content group) are left untouched.',
            },
        },
    },
}

export const SuggestedWithRecents: Story = {
    render: () => (
        <Container
            taxonomicGroupTypes={[TaxonomicFilterGroupType.Events, TaxonomicFilterGroupType.EventProperties]}
            seedRecents={[
                { groupType: TaxonomicFilterGroupType.EventProperties, groupName: 'Event properties', value: 'plan' },
                { groupType: TaxonomicFilterGroupType.Events, groupName: 'Events', value: 'signed up' },
            ]}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'With no query, the Suggested tab leads with the user’s recent selections (here a recent event and a recent property), each carrying its source group, before the rest of the tab. This is the no-query recents prefix ported from the legacy picker.',
            },
        },
    },
}

export const SuggestedAggregatedSearch: Story = {
    render: () => (
        <Container
            taxonomicGroupTypes={[TaxonomicFilterGroupType.Events, TaxonomicFilterGroupType.EventProperties]}
            initialSearchQuery="n"
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Searching from the Suggested tab surfaces the best matches from every content group at once — events and properties interleaved here — slot-distributed across groups and deduped against any recents/pinned. This is the cross-tab aggregation that makes the Suggested tab the one-stop search surface.',
            },
        },
    },
}
