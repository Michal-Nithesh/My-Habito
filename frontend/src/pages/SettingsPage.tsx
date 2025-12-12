import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h2 className="text-3xl font-bold text-foreground mb-6">Settings</h2>

        <Card className="shadow-habito">
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure your preferences, theme, language, and other settings here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
