describe("🚀 Critical User Journey: Crear Proyecto y Usar Tutor", () => {
  
  // Ruta donde se muestran los proyectos
  const PROJECTS_URL = "/projects"; 

  const PROJECT = {
    _id: "p_journey_1",
    id: "p_journey_1",
    name: "Proyecto Journey E2E",
    description: "Creado durante el test completo",
    status: "in_progress",
    tags: ["Cypress"],
    progressPercent: 0,
    ownerId: "user_real_id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // 1. LOGIN REAL (Igual que en Home.cy.js)
    // Usamos las credenciales que confirmaste que funcionan en tu DB
    cy.loginAPI("asd@gmail.com", "asdasdasd");

    // 2. MOCK INICIAL: "Dashboard Limpio"
    // Interceptamos ANTES de visitar para asegurar que atrapamos la petición
    cy.intercept("GET", "/api/projects*", {
      statusCode: 200,
      body: { ok: true, data: [] }, // Empezamos vacíos para el test
    }).as("getEmptyProjects");

    // 3. VISITAR
    cy.visit(PROJECTS_URL);

    // 4. ESPERAR CARGA
    // Esto confirma que el login funcionó y la página cargó
    cy.wait("@getEmptyProjects");
  });

  it("👤 Flujo Completo: Crear Proyecto -> Abrir Tutor -> Generar -> Responder -> Guardar", () => {
    
    // --- PASO 1: Validar estado inicial ---
    cy.get('[data-testid="student-projects-view"]').should("be.visible");
    
    // --- PASO 2: Crear Proyecto ---
    cy.get('[data-testid="btn-new-project"]').click();
    cy.get('[data-testid="input-create-name"]').type(PROJECT.name);

    // Mock Creación
    cy.intercept("POST", "/api/projects", {
      statusCode: 201,
      body: { ok: true, data: PROJECT },
    }).as("createProject");

    cy.get('[data-testid="btn-create-save"]').click();
    cy.wait("@createProject");

    // Validar que aparece en la lista
    cy.contains(PROJECT.name).should("be.visible");

    // --- PASO 3: Abrir Tutor ---
    // Mock Actividad (El modal la busca al abrir)
    cy.intercept("POST", "/api/reading-activities", {
        statusCode: 201, body: { ok: true, data: { _id: "act_journey_1" } }
    }).as("ensureActivity");

    // Click en botón Tutor del proyecto recién creado
    cy.get(`[data-testid="btn-tutor-${PROJECT._id}"]`).click();
    
    // Esperar a que el modal cargue y asegure la actividad
    cy.wait("@ensureActivity");
    cy.contains(`Tutor de Lectura — ${PROJECT.name}`).should("be.visible");

    // --- PASO 4: Generar (AI Mock) ---
    cy.intercept("POST", "/api/generate-qa", {
        statusCode: 200,
        body: [{ 
          question: "¿Es Cypress genial?", 
          answers: [{ text: "Sí", correct: true }, { text: "No", correct: false }], 
          feedback: "Definitivamente." 
        }]
    }).as("genAI");

    cy.get('[data-testid="tutor-text-area"]').type("Texto base journey.");
    cy.get('[data-testid="tutor-btn-generate"]').click();
    
    cy.wait("@genAI");
    cy.contains("¿Es Cypress genial?").should("be.visible");

    // --- PASO 5: Responder y Evaluar ---
    // Responder opción 0 (Sí)
    cy.get('[data-testid="q0-opt0"]').click();
    cy.get('[data-testid="tutor-btn-verify"]').click();
    cy.contains("¡Correcto!").should("be.visible");

    // Escribir reflexión
    cy.get('[data-testid="tutor-reflection-area"]')
      .type("Esta es una reflexión válida de más de cincuenta caracteres para pasar la validación del frontend.");

    // Mock Evaluar (IA)
    cy.intercept("POST", "/api/evaluate-open", {
        statusCode: 200, body: { score: 20, feedback: "Excelente." }
    }).as("evalAI");

    // Mock Guardar Resultado (DB)
    cy.intercept("POST", "/api/reading-results", {
        statusCode: 201, body: { ok: true }
    }).as("saveRes");

    // Click Evaluar y Guardar
    cy.get('[data-testid="tutor-btn-eval-save"]').click();

    cy.wait("@evalAI");
    cy.wait("@saveRes");

    // --- PASO 6: Verificación Final ---
    cy.get('[data-testid="tutor-save-success"]')
      .scrollIntoView()
      .should("be.visible");
  });
});