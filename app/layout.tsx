import Header from '@/components/Header'

export const metadata = { title: 'ShopFast (vulnerable demo)' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: 16 }}>
        <p style={{ background: '#fbebeb', padding: 8 }}>
          Intentionally vulnerable demo application for security training. Not a real store.
        </p>
        <Header />
        {children}
      </body>
    </html>
  )
}
