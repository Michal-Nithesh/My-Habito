import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h2 className="text-3xl font-bold text-foreground mb-6">Statistics</h2>

        <Card className="shadow-habito">
          <CardHeader>
            <CardTitle>Overview Statistics and Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your habit statistics, charts, and progress insights will appear here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
