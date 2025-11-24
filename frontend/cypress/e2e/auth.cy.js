describe("🔐 Login Page E2E", () => {
    beforeEach(() => {
        // Visitamos la página de login antes de cada test
        // Asegúrate de que baseUrl en cypress.config.js apunte a tu frontend (ej: http://localhost:5173)
        cy.visit("/login");
    });

    it("✅ Debe iniciar sesión correctamente y redirigir (Happy Path)", () => {
        // 1. MOCK CON DELAY
        cy.intercept("POST", "/api/auth/login", {
            delay: 1000, // ⏳ RETRASO ARTIFICIAL DE 1 SEGUNDO
            statusCode: 200,
            body: {
                ok: true,
                data: {
                    token: "fake-jwt-token-123",
                    user: { id: "u1", name: "Estudiante Cypress", role: "student" },
                },
            },
        }).as("loginRequest");

        // 2. ACT
        cy.get('[data-testid="login-email"]').type("asdt@gmail.com");
        cy.get('[data-testid="login-pass"]').type("asdasdasd");
        cy.get('[data-testid="login-submit-btn"]').click();

        // 4. ASSERT: Ahora sí le dará tiempo a ver el texto
        cy.contains("Ingresando...").should("be.visible");

        // Opcional: Verificar que el botón está deshabilitado mientras carga
        cy.get('[data-testid="login-submit-btn"]').should("be.disabled");

        // 5. WAIT
        cy.wait("@loginRequest");

        // ESTRATEGIA ALTERNATIVA:
        // 1. Verificamos primero que cambie la URL (señal inequívoca de éxito)
        cy.url().should("include", "/tutor");

        // 2. Opcional: Si el mensaje desaparece muy rápido, eliminamos esa aserción
        // o verificamos que NO estemos en login.
        cy.get('[data-testid="login-email"]').should("not.exist");
    });

    it("❌ Debe mostrar error con credenciales incorrectas", () => {
        // 1. MOCK: Simulamos error 401 del backend
        cy.intercept("POST", "/api/auth/login", {
            statusCode: 401,
            body: {
                ok: false,
                error: "Credenciales inválidas",
            },
        }).as("loginError");

        // 2. ACT: Escribir datos
        cy.get('[data-testid="login-email"]').type("bad@email.com");
        cy.get('[data-testid="login-pass"]').type("wrongpass");
        cy.get('[data-testid="login-submit-btn"]').click();

        // 3. WAIT: Esperar respuesta
        cy.wait("@loginError");

        // 4. ASSERT: Verificar mensaje de error en pantalla
        cy.get('[data-testid="login-feedback"]')
            .should("be.visible")
            .and("have.class", "text-red-700") // Verificamos estilo de error (opcional)
            .and("contain", "Credenciales inválidas");

        // 5. ASSERT: Verificar que NO redirigió
        cy.url().should("include", "/login");
    });

    it("⚠️ Debe manejar error de red (Servidor Caído)", () => {
        // 1. MOCK: Forzamos fallo de red
        cy.intercept("POST", "/api/auth/login", {
            forceNetworkError: true,
        }).as("networkFail");

        cy.get('[data-testid="login-email"]').type("asd@gmail.com");
        cy.get('[data-testid="login-pass"]').type("asdasdasd");
        cy.get('[data-testid="login-submit-btn"]').click();

        cy.wait("@networkFail");

        // Verificar mensaje genérico o de error de fetch
        cy.get('[data-testid="login-feedback"]')
            .should("be.visible")
            .invoke('text')
            .should('match', /Failed to fetch|NetworkError|No se pudo iniciar sesión|Network request failed/i);
    });
});