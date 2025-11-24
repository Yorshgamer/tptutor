describe("🤖 Tutor Inteligente E2E", () => {

    const PROJECTS_URL = "/projects"; // o "/tutor"

    // Credenciales de prueba fijas
    const TEST_USER = {
        name: "Cypress Tutor",
        email: "asd@gmail.com", // Usamos un mail específico para tests
        password: "asdasdasd",
        role: "student"
    };

    // 1. SETUP INICIAL: Asegurar que el usuario existe
    before(() => {
        // Hacemos una petición directa al backend para crear el usuario.
        // failOnStatusCode: false permite que no falle si el usuario ya existe (error 409).
        cy.request({
            method: 'POST',
            url: '/api/auth/register',
            failOnStatusCode: false,
            body: TEST_USER
        }).then((resp) => {
            // Si falló por algo que NO sea "ya existe" (409), entonces sí nos preocupamos
            if (resp.status !== 201 && resp.status !== 409) {
                throw new Error(`No se pudo preparar el usuario de test: ${resp.status}`);
            }
        });
    });

    // Mocks de datos (Igual que antes)
    const mockProject = {
        _id: "p1",
        ownerId: "student_id_placeholder", // No importa en el mock
        name: "Proyecto Tutor",
        description: "Test Tutor",
        status: "in_progress",
        tags: [],
        progressPercent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockGeneratedQA = [
        {
            question: "¿De qué color es el caballo blanco de San Martín?",
            answers: [
                { text: "Negro", correct: false },
                { text: "Blanco", correct: true },
                { text: "Marrón", correct: false },
                { text: "Azul", correct: false }
            ],
            feedback: "Es blanco por definición."
        }
    ];

    const mockEvaluation = {
        score: 18,
        feedback: "Excelente reflexión, capturaste la esencia."
    };

    beforeEach(() => {
        // 2. LOGIN REAL (Ahora seguro porque el usuario existe)
        cy.loginAPI(TEST_USER.email, TEST_USER.password);

        // 3. Mock Projects (Interceptamos GET)
        cy.intercept("GET", "/api/projects*", {
            statusCode: 200,
            body: { ok: true, data: [mockProject] },
        }).as("getProjects");

        // 4. Mock Reading Activities (El modal las busca al abrir)
        // Importante: Simular que la actividad se crea o existe
        cy.intercept("POST", "/api/reading-activities", {
            statusCode: 201,
            body: { ok: true, data: { _id: "act1" } }
        }).as("ensureActivity");

        // 5. Visitar
        cy.visit(PROJECTS_URL);
        cy.wait("@getProjects");
    });

    it("✅ Flujo Completo: Generar -> Responder -> Evaluar -> Guardar", () => {
        // ... (El resto de tu test que ya estaba bien) ...

        // 1. Abrir Modal de Tutor
        // Nota: Asegúrate que tu componente Row tenga data-testid={`btn-tutor-${p.id}`}
        // Si usaste mi código anterior de Projects.tsx, ya lo tiene.
        cy.get('[data-testid="btn-tutor-p1"]').click();

        // Verificar que el modal cargó
        cy.contains(`Tutor de Lectura — ${mockProject.name}`).should("be.visible");

        // Espera crítica: El modal llama a la API al abrirse
        cy.wait("@ensureActivity");

        // 2. Generar Preguntas
        cy.intercept("POST", "/api/generate-qa", {
            delay: 1000,
            statusCode: 200,
            body: mockGeneratedQA
        }).as("generateAI");

        const textoBase = "El caballo blanco de San Martín es un símbolo histórico.";
        cy.get('[data-testid="tutor-text-area"]').type(textoBase);

        cy.get('[data-testid="tutor-btn-generate"]').click();
        cy.contains("Generando...").should("be.visible");

        cy.wait("@generateAI");

        // 3. Responder
        cy.get('[data-testid="tutor-results-list"]').should("be.visible");

        // Seleccionar la correcta (Option 1 -> Blanco)
        cy.get('[data-testid="q0-opt1"]').click();

        cy.get('[data-testid="tutor-btn-verify"]').click();
        cy.contains("¡Correcto!").should("be.visible");

        // 4. Evaluar Reflexión
        const reflexion = "El texto habla sobre la importancia simbólica del caballo blanco y su relevancia en la historia patriótica. Es un ícono de libertad.";
        cy.get('[data-testid="tutor-reflection-area"]').type(reflexion);

        cy.intercept("POST", "/api/evaluate-open", {
            delay: 1000,
            statusCode: 200,
            body: mockEvaluation
        }).as("evaluateAI");

        cy.intercept("POST", "/api/reading-results", {
            statusCode: 201,
            body: { ok: true, data: { id: "res1", passed: true } }
        }).as("saveResult");

        // Interceptamos la recarga de proyectos que ocurre al final
        cy.intercept("GET", "/api/projects*", {
            statusCode: 200,
            body: { ok: true, data: [{ ...mockProject, progressPercent: 100 }] }
        }).as("reloadProjects");

        cy.get('[data-testid="tutor-btn-eval-save"]').click();
        cy.contains("Evaluando...").should("be.visible");

        cy.wait("@evaluateAI");
        cy.wait("@saveResult");

        // 5. Validaciones Finales

        // Ver feedback de la IA (Esto ya pasaba bien)
        cy.get('[data-testid="tutor-final-eval"]').should("contain", "18 / 20");

        // SOLUCIÓN AQUÍ 👇
        // Hacemos scroll hasta el mensaje de éxito porque quedó muy abajo en el modal
        cy.get('[data-testid="tutor-save-success"]')
            .scrollIntoView()
            .should("be.visible");
    });
});