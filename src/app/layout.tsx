// import type { Metadata } from "next";
// import "./globals.css"
// import AuthProvider from "@/components/providers/AuthProvider";
// import ThemeProvider from "@/components/providers/ThemeProvider";

// export const metadata: Metadata = {
//   title: "pislk",
//   description: "Chat Pislk",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className="min-h-full flex flex-col">
//         <AuthProvider>
//           <ThemeProvider>{children}</ThemeProvider>
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { FatalErrorBoundary } from "@/components/molecules/ErrorBoundary";

export const metadata: Metadata = {
  title: "pislk",
  description: "Chat Pislk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                showFatalError(e.error || e.message);
              });
              window.addEventListener('unhandledrejection', function(e) {
                showFatalError(e.reason);
              });
              function showFatalError(err) {
                if (document.getElementById('__fatal_error_overlay')) return;
                var box = document.createElement('div');
                box.id = '__fatal_error_overlay';
                box.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(13,11,20,0.97);color:#fff;padding:20px;font-family:monospace;font-size:13px;overflow:auto;white-space:pre-wrap;';
                var msg = (err && err.stack) ? err.stack : String(err);
                box.textContent = '⚠ ERROR:\\n\\n' + msg;
                document.body.appendChild(box);
              }
            `,
          }}
        />
        <AuthProvider>
          <ThemeProvider>
            <FatalErrorBoundary>{children}</FatalErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
