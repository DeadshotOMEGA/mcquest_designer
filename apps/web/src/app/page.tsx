import { SCHEMA_VERSION } from '@mcquest/schema'
import { EXPORT_VERSION, SUPPORTED_VERSIONS } from '@mcquest/export'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">MCQuest Designer</h1>
        <p className="text-muted-foreground mb-8">
          Visual graph editor for FTB Quests questbooks
        </p>

        <div className="flex gap-4 mb-8">
          <Button>Get Started</Button>
          <Button variant="outline">Documentation</Button>
          <Button variant="secondary">Settings</Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Package Versions</h2>
          <ul className="space-y-2 text-sm text-muted-foreground mb-6">
            <li>
              <span className="font-medium text-foreground">Schema:</span> {SCHEMA_VERSION}
            </li>
            <li>
              <span className="font-medium text-foreground">Export:</span> {EXPORT_VERSION}
            </li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">Supported Minecraft Versions</h3>
          <div className="flex gap-2">
            {SUPPORTED_VERSIONS.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
