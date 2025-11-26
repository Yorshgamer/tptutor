describe("📂 Student Projects Management", () => {
  
  // ⚠️ RUTA FIJA según tu indicación
  const PROJECTS_URL = "/projects"; 

  // DATOS MOCK ROBUSTOS (Coinciden con tu tipo BackendProject)
  const mockProjects = [
    {
      _id: "p1", // IMPORTANTE: _id con guion bajo para que mapProject funcione
      ownerId: "student1",
      name: "Proyecto Alpha",
      description: "Tesis de IA",
      status: "in_progress",
      tags: ["IA", "Python"],
      progressPercent: 50,
      totalActivities: 10,
      completedActivities: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "p2",
      ownerId: "student1",
      name: "Proyecto Beta",
      description: "App Web",
      status: "done",
      tags: ["React", "Node"],
      progressPercent: 100,
      totalActivities: 10,
      completedActivities: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  beforeEach(() => {

    cy.loginAPI("asd@gmail.com", "asdasdasd");
    cy.intercept("GET", "/api/projects*", {

      statusCode: 200,

      body: { ok: true, data: mockProjects },

    }).as("getProjects");

    cy.visit(PROJECTS_URL);

    cy.wait("@getProjects");

  });

  it("✅ Debe listar los proyectos y calcular el progreso global", () => {
    // Verificar contenedor
    cy.get('[data-testid="student-projects-view"]').should("be.visible");

    // Verificar filas (usamos have.length.at.least por seguridad)
    cy.get('[data-testid^="project-row-"]').should("have.length", 2);

    // Verificar datos dentro de la fila P1
    cy.get('[data-testid="project-row-p1"]').within(() => {
      // Buscamos el texto directamente si el testid falla por renderizado dinámico
      cy.contains("Proyecto Alpha").should("be.visible");
      cy.contains("En curso").should("be.visible");
      cy.contains("50%").should("be.visible");
    });

    // Verificar progreso global
    cy.get('[data-testid="global-progress-text"]').should("contain", "75%");
  });

  it("✅ Debe filtrar proyectos (Mock Backend)", () => {
    // Interceptar búsqueda específica
    cy.intercept("GET", "/api/projects*q=Alpha*", {
      statusCode: 200,
      body: { ok: true, data: [mockProjects[0]] },
    }).as("searchProjects");

    cy.get('[data-testid="search-input"]').type("Alpha");
    cy.wait("@searchProjects");

    // Debe quedar solo 1
    cy.get('[data-testid^="project-row-"]').should("have.length", 1);
    cy.get('[data-testid="project-row-p1"]').should("be.visible");
    cy.get('[data-testid="project-row-p2"]').should("not.exist");
  });

  it("✅ Debe crear un nuevo proyecto", () => {
    const newName = `Proyecto Nuevo ${Date.now()}`;

    // 1. Abrir modal
    cy.get('[data-testid="btn-new-project"]').click();
    cy.get('[data-testid="modal-create-project"]').should("be.visible");

    // 2. Llenar formulario
    cy.get('[data-testid="input-create-name"]').type(newName);

    // 3. Interceptar POST (Creación)
    cy.intercept("POST", "/api/projects", {
      statusCode: 201,
      body: {
        ok: true,
        data: {
          _id: "p3", // ID NUEVO
          ownerId: "student1",
          name: newName,
          description: "Creado en test",
          status: "in_progress",
          tags: [],
          progressPercent: 0,
          totalActivities: 0,
          completedActivities: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    }).as("createProject");

    // ❌ ELIMINADO: No interceptamos GET porque el front no recarga, actualiza localmente.

    // 4. Guardar
    cy.get('[data-testid="btn-create-save"]').click();

    // 5. Esperar SOLO al POST
    cy.wait("@createProject");

    // ❌ ELIMINADO: cy.wait("@reloadProjects");

    // 6. Verificar UI
    // El modal debe cerrarse
    cy.get('[data-testid="modal-create-project"]').should("not.exist");
    
    // El nuevo proyecto debe aparecer en la lista (gracias al setItems local)
    cy.contains(newName).should("be.visible");
  });

  it("✅ Debe eliminar un proyecto", () => {
    cy.intercept("DELETE", "/api/projects/p1", {
      statusCode: 200,
      body: { ok: true },
    }).as("deleteProject");

    cy.on("window:confirm", () => true);

    cy.get('[data-testid="btn-delete-p1"]').click();
    cy.wait("@deleteProject");

    cy.get('[data-testid="project-row-p1"]').should("not.exist");
  });
});