# TPTUTOR

**TPTUTOR** es una aplicación web full-stack (MERN) que funciona como un **tutor virtual de lectura crítica**.  
El sistema ayuda a estudiantes y docentes a desarrollar habilidades de pensamiento crítico mediante:

- **Generación automática de preguntas** sobre textos.
- **Detección de sesgos y falacias** utilizando Inteligencia Artificial.
- **Automatización de flujos** de trabajo como recordatorios, notificaciones y registro de progreso, mediante **n8n**.

---

## Descripción general

El proyecto **TPTUTOR** tiene como finalidad apoyar el proceso educativo a través de la lectura crítica, promoviendo la comprensión, el razonamiento y la argumentación lógica.  
A través del uso de **Inteligencia Artificial**, el sistema genera preguntas de análisis, identifica sesgos o falacias en los textos y ofrece retroalimentación personalizada al usuario.

Este sistema está orientado tanto a **estudiantes** como a **docentes**:
- Los estudiantes pueden practicar y recibir retroalimentación inmediata.
- Los docentes pueden asignar textos, revisar estadísticas de desempeño y generar reportes de progreso.

La arquitectura del proyecto se diseñó con el enfoque **MERN (MongoDB, Express, React, Node.js)**, lo que permite escalabilidad, modularidad y facilidad de mantenimiento.

---

## Tecnologías principales

- **Frontend:** React.js + Redux Toolkit / Context API  
- **Backend:** Node.js + Express.js (API REST)  
- **Base de datos:** MongoDB (Atlas o local)  
- **Inteligencia Artificial:** Hugging Face Transformers y Ollama API (modelo `gemma:2b`)  
- **Automatización:** n8n  
- **Contenerización:** Docker + docker-compose  
- **Pruebas:** Jest (Backend y Frontend)

---

## Objetivos del proyecto

1. Desarrollar un **sistema innovador y escalable** que apoye el desarrollo de la lectura crítica en estudiantes.  
2. Integrar **Inteligencia Artificial** en el flujo educativo mediante generación automática de preguntas y detección de sesgos.  
3. Implementar **automatización** de tareas y recordatorios usando **n8n**.  
4. Aplicar **metodología ágil (Scrum/Kanban)** durante el desarrollo.  
5. Mantener una **documentación técnica clara** y buenas prácticas de ingeniería de software.

---

## Arquitectura del sistema

La arquitectura sigue el modelo **MERN**:

- **Frontend (React):** interfaz moderna, intuitiva y dinámica.  
- **Backend (Node.js + Express):** API RESTful que gestiona usuarios, textos, preguntas y resultados.  
- **Base de datos (MongoDB):** almacenamiento de usuarios, registros de lectura, preguntas y progreso.  
- **Automatización (n8n):** envía notificaciones automáticas y registra la actividad del usuario.  
- **Contenerización (Docker):** permite ejecutar todo el entorno en contenedores para asegurar portabilidad y estabilidad.  

Diagrama general de arquitectura:

```mermaid
graph TD
A[Frontend - React] --> B[Backend - Express API]
B --> C[Base de Datos - MongoDB]
B --> D[Automatización - n8n]
B --> E[Inteligencia Artificial - Ollama/Hugging Face]


