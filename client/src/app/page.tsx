import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/cesae-logo.svg" alt="CESAE Digital" className="h-8" />
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-block bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          Plataforma de certificação digital
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-2xl mb-6">
          Badges e certificados<br />para os seus eventos
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-10">
          A CESAE Digital emite credenciais digitais verificáveis para formações, cursos e eventos. Partilhe as suas conquistas com o mundo.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-blue-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors text-sm"
          >
            Aceder ao painel
          </Link>
          <Link
            href="/validate"
            className="border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Validar um certificado
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-gray-100 px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Certificados verificáveis</h3>
            <p className="text-sm text-gray-500">Cada certificado tem um código único que permite verificar a sua autenticidade online.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Badges digitais</h3>
            <p className="text-sm text-gray-500">Badges personalizados com a identidade da CESAE, prontos a partilhar no LinkedIn.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Envio automatico</h3>
            <p className="text-sm text-gray-500">Certificados e badges enviados por email automaticamente apos a emissao.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-6 flex items-center justify-center text-xs text-gray-400">
        <span>CESAE Digital © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
