export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-4xl font-bold">Next.js Template</h1>
                <p className="text-muted-foreground">
                    Your minimal Next.js initialization template is ready! 🚀
                </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border p-6">
                <h2 className="text-2xl font-semibold">Getting Started</h2>
                <ol className="list-inside list-decimal space-y-2 text-sm">
                    <li>Run <code className="rounded bg-muted px-2 py-1">pnpm install</code> to install dependencies</li>
                    <li>Create a <code className="rounded bg-muted px-2 py-1">.env.local</code> file for environment variables</li>
                    <li>Run <code className="rounded bg-muted px-2 py-1">npx shadcn@latest init</code> to set up shadcn/ui</li>
                    <li>Start the dev server with <code className="rounded bg-muted px-2 py-1">pnpm dev</code></li>
                </ol>
            </div>
        </div>
    );
}
