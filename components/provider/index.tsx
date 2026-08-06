import { Toaster } from "../ui/sonner";
import QueryProvider from "./tanstack-query";
import { ThemeProvider } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
                <Toaster />
            </ThemeProvider>
        </QueryProvider>
    );
}
