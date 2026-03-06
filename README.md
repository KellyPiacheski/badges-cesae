# badges-cesae
Plataforma web de emissão de badges digitais e certificados PDF para participantes de cursos e eventos do CESAE Digital. Inclui validação por código único e partilha no LinkedIn.

## Funcionalidades Principais
- Gestão de eventos e cursos (CRUD completo)
- Importação de participantes (manual, CSV, Excel)
- Emissão de badges digitais com templates personalizáveis
- Geração de certificados PDF com código de validação único
- Envio de emails em massa
- Página pública de validação de certificados
- Partilha no LinkedIn
- Dashboard de estatísticas


## Stack Tecnológica
- **Frontend:** React + Next.js
- **Backend:** Node.js + Express
- **Base de Dados:** PostgreSQL
- **Autenticação:** JWT + bcrypt
- **Email:** Nodemailer / Resend
- **Badges/PDFs:** Canvas API + Puppeteer


## Equipa (Team PC)
- **Pedro Campos** — Team Leader, Arquitetura, Backend, Backoffice
- **Kelly Wolmer** — Wireframe DB, Backend, Email
- **Lucas Santos** — Frontend Público, Badges, Certificados, LinkedIn


## Como Correr o Projeto
```bash
# Clonar o repositório
git clone https://github.com/pehmsc/badges-cesae.git
cd badges-cesae


# Instalar dependências
npm install


# Configurar variáveis de ambiente
cp .env.example .env


# Correr em desenvolvimento
npm run dev
```


## Cliente
Bruno Santos — CESAE Digital
