// ALTERAÇÃO: arquivo novo. Substitui o antigo Header.jsx (um cabeçalho
// grande e fixo, igual em todas as telas) por um cabeçalho compacto e
// específico de cada página — igual ao que aparece nas suas capturas de
// tela (bolinha vermelha + rótulo em maiúsculas + título da página).
// Fica mais rápido de ler no celular e ocupa menos espaço vertical, deixando
// mais tela para o conteúdo (funcionários, dias da semana, relatório etc.).
export default function PageHeader({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="page-header">
      <div className="page-header-row">
        <span className="page-header-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="page-header-eyebrow">{eyebrow}</span>
      </div>
      <h1 className="page-header-title">{title}</h1>
      {/* "children" permite cada página encaixar um subtítulo/ação extra
          logo abaixo do título, sem precisar duplicar o componente. */}
      {children}
    </div>
  );
}
