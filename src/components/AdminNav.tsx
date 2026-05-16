import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav className="bg-gray-900 text-white p-4 mb-6">
      <div className="max-w-7xl mx-auto flex gap-6 items-center">
        <span className="font-bold text-blue-400">JM HNOS ADMIN</span>
        <Link href="/admin/products" className="hover:text-blue-300 text-sm">Inventario</Link>
        <Link href="/admin/import" className="hover:text-blue-300 text-sm">Importar Listas</Link>
        <Link href="/catalogo" className="hover:text-blue-300 text-sm ml-auto border-l pl-6 border-gray-700">Ver Catálogo Público</Link>
      </div>
    </nav>
  );
}