describe("📝 Register Page E2E", () => {
  
  beforeEach(() => {
    // Asume que tienes una ruta /register en tu Router
    cy.visit("/register");
  });

  it("✅ Debe registrar un usuario correctamente (Happy Path)", () => {
    // 1. Mock de la respuesta exitosa
    cy.intercept("POST", "/api/auth/register", {
      delay: 500, // Un poco de delay para ver el loading
      statusCode: 201, // Created
      body: {
        ok: true,
        data: {
          token: "fake-new-token-abc",
          user: { id: "new_user", name: "Nuevo Alumno", role: "student" },
        },
        message: "Usuario registrado correctamente"
      },
    }).as("registerReq");

    // 2. Llenar formulario
    cy.get('[data-testid="reg-name"]').type("Nuevo Alumno");
    cy.get('[data-testid="reg-email"]').type("new@student.com");
    
    // Seleccionar Rol (opcional si el default es student, pero bueno probarlo)
    cy.get('[data-testid="reg-role"]').select("Alumno"); // O el texto que muestre tu <option>

    cy.get('[data-testid="reg-pass1"]').type("secret123");
    cy.get('[data-testid="reg-pass2"]').type("secret123"); // Coinciden

    // 3. Enviar
    cy.get('[data-testid="reg-submit-btn"]').click();

    // 4. Verificar estado de carga
    cy.contains("Registrando...").should("be.visible");

    // 5. Esperar red
    cy.wait("@registerReq");

    // 6. Verificar éxito visual
    cy.get('[data-testid="reg-feedback"]')
      .should("be.visible")
      .and("contain", "Cuenta creada");

    // 7. Verificar localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.eq("fake-new-token-abc");
    });

    // 8. Verificar redirección (después del timeout)
    cy.url().should("include", "/tutor");
  });

  it("⚠️ Debe validar que las contraseñas coincidan (Validación Cliente)", () => {
    // Llenamos con passwords distintos
    cy.get('[data-testid="reg-name"]').type("User Fail");
    cy.get('[data-testid="reg-email"]').type("fail@test.com");
    cy.get('[data-testid="reg-pass1"]').type("passwordA");
    cy.get('[data-testid="reg-pass2"]').type("passwordB"); // Distinto

    // Espiamos la red para asegurar que NO se llame
    const spy = cy.spy().as("fetchSpy");
    cy.on("window:fetch", spy);

    cy.get('[data-testid="reg-submit-btn"]').click();

    // Verificar mensaje de error
    cy.get('[data-testid="reg-feedback"]')
      .should("be.visible")
      .and("contain", "contraseñas no coinciden");

    // IMPORTANTE: Verificar que NO se hizo la petición al backend
    // (Nota: interceptar sin llamar al alias también funciona para verificar que no ocurrió)
    // Pero Cypress UI mostraría si hubo una llamada XHR/Fetch.
  });

  it("❌ Debe manejar error si el correo ya existe (Error Backend 409)", () => {
    // 1. Mock de error (Conflicto / Email en uso)
    cy.intercept("POST", "/api/auth/register", {
      delay: 200,
      statusCode: 409, // Conflict
      body: {
        ok: false,
        error: "El correo ya está en uso",
      },
    }).as("registerConflict");

    cy.get('[data-testid="reg-name"]').type("User Existente");
    cy.get('[data-testid="reg-email"]').type("used@email.com");
    cy.get('[data-testid="reg-pass1"]').type("123456");
    cy.get('[data-testid="reg-pass2"]').type("123456");

    cy.get('[data-testid="reg-submit-btn"]').click();

    cy.wait("@registerConflict");

    // Verificar mensaje de error del backend
    cy.get('[data-testid="reg-feedback"]')
      .should("be.visible")
      .and("contain", "El correo ya está en uso"); // O el texto exacto que devuelve tu backend mockeado
  });
});