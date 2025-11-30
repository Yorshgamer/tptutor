🎓 TPTUTOR - Tutor Virtual de Lectura Crítica con IA

TPTUTOR es una plataforma educativa Full-Stack diseñada para potenciar el pensamiento crítico mediante Inteligencia Artificial. El sistema genera preguntas automáticas, detecta sesgos argumentativos y gestiona flujos de aprendizaje automatizados.

📑 Tabla de Contenidos

Descripción del Proyecto

Arquitectura y Stack Tecnológico

Requisitos Previos (Crítico)

Instalación y Despliegue

Estrategia de QA y Testing

Estructura del Proyecto

🚀 Descripción del Proyecto

El sistema ayuda a estudiantes y docentes a desarrollar habilidades de pensamiento crítico mediante:

Generación automática de preguntas sobre textos (PDF/Texto plano).

Detección de sesgos y falacias utilizando LLMs locales (Ollama).

Automatización de flujos (recordatorios, notificaciones y registro de progreso con n8n).

Dashboard interactivo para seguimiento de métricas.

Roles de Usuario

Estudiantes: Practican lectura, reciben feedback inmediato de la IA.

Docentes: Asignan textos, revisan estadísticas y generan reportes.

🏗 Arquitectura y Stack Tecnológico

El proyecto sigue una arquitectura MERN (MongoDB, Express, React, Node.js) contenerizada, priorizando la escalabilidad y el mantenimiento.

Diagrama de Arquitectura

graph TD
    User((Usuario)) -->|Navegador| Client[Frontend - React + Vite]
    
    subgraph Docker Network
        Client -->|HTTP/REST| API[Backend - Express API]
        API -->|Mongoose| DB[(MongoDB Atlas)]
    end

    subgraph Host Machine / Servicios Externos
        API -->|Webhook| N8N[Automatización - n8n]
        API -->|Inference| AI[IA Local - Ollama]
    end


Tecnologías Principales

Área

Tecnología

Propósito

Frontend

React 19, Vite, TailwindCSS

Interfaz de usuario rápida y responsiva.

Backend

Node.js, Express.js

API RESTful, gestión de lógica de negocio.

Base de Datos

MongoDB Atlas

Persistencia de datos en la nube.

IA

Ollama (Gemma:2b), HuggingFace

Procesamiento de lenguaje natural local.

DevOps

Docker, Docker Compose

Orquestación de entornos.

QA

Jest, Cypress

Pruebas unitarias, integración y E2E.

⚠️ Requisitos Previos (CRÍTICO)

Debido a la naturaleza híbrida de la arquitectura (Contenedores + Servicios Locales), es obligatorio tener los siguientes servicios corriendo en tu máquina host antes de iniciar Docker.

1. Ollama (Inteligencia Artificial)

El backend se comunica con Ollama para la inferencia de IA.

Descargar e instalar Ollama.

Descargar el modelo gemma:2b (liviano y eficiente):

ollama pull gemma:2b


Iniciar el servidor:

ollama serve


Debe estar escuchando en el puerto 11434.

2. n8n (Automatización)

Gestión de webhooks para notificaciones y reportes.

Instalar y ejecutar n8n (versión de escritorio o npm).

Asegurar que escucha en el puerto 5678.

Configuración del Webhook:

URL: http://localhost:5678/webhook/tptutor/reading-completed

Método: POST

🔧 Instalación y Despliegue

1. Variables de Entorno

Crear un archivo .env en la carpeta backend/:

PORT=5000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/tptutor
JWT_SECRET=tu_clave_secreta_super_segura
# Nota: OLLAMA_BASE_URL y N8N se configuran en docker-compose para apuntar al host


2. Ejecución con Docker (Recomendado)

El proyecto utiliza host.docker.internal para conectar los contenedores con Ollama y n8n en tu máquina.

# Construir imágenes y levantar servicios
docker-compose up --build


Frontend: http://localhost:5173

Backend: http://localhost:5000

3. Ejecución Manual (Modo Desarrollo)

Backend:

cd backend
npm install
npm run dev


Frontend:

cd frontend
npm install
npm run dev


🧪 Estrategia de QA y Testing

El proyecto sigue una estrategia de testing piramidal estricta.

✅ Backend: Unit & Integration Testing (Jest)

Probamos controladores, servicios y utilidades.

cd backend

# Ejecutar todos los tests
npm test

# Ver reporte de cobertura de código
npm run test -- --coverage


✅ Frontend: Unit Testing (Jest + React Testing Library)

Probamos componentes aislados y hooks personalizados.

cd frontend
npm test


✅ E2E: End-to-End Testing (Cypress)

Simulamos el flujo completo del usuario real en el navegador.
Requisito: El servidor de desarrollo (npm run dev) debe estar corriendo en http://localhost:5173.

cd frontend

# Modo Interactivo (Abre la UI de Cypress)
npm run test:e2e:open

# Modo Headless (Para CI/CD - Ejecuta en consola)
npm run test:e2e:run


📂 Estructura del Proyecto

/
├── backend/                # API REST Express
│   ├── src/
│   │   ├── controllers/    # Lógica de los endpoints
│   │   ├── models/         # Schemas de Mongoose
│   │   ├── routes/         # Definición de rutas API
│   │   ├── services/       # Lógica compleja (IA, PDF)
│   │   └── index.js        # Punto de entrada
│   ├── tests/              # Tests unitarios de Backend
│   ├── Dockerfile          # Configuración de imagen Docker
│   └── package.json
│
├── frontend/               # SPA React + Vite
│   ├── src/
│   │   ├── components/     # Componentes UI reutilizables
│   │   ├── pages/          # Vistas principales
│   │   ├── context/        # Estado global (Context API)
│   │   └── hooks/          # Custom Hooks
│   ├── cypress/            # Tests E2E
│   │   └── e2e/            # Escenarios de prueba
│   ├── Dockerfile          # Configuración de imagen Docker
│   └── package.json
│
└── docker-compose.yml      # Orquestación de servicios


Nota para Desarrolladores: Este proyecto utiliza ES Modules (import/export) tanto en backend como en frontend. Asegúrese de mantener esta convención al crear nuevos archivos.
