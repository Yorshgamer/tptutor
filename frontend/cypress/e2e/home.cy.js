describe("🏠 Home / Dashboard E2E", () => {
  const HOME_URL = "/"; // La ruta protegida

  context("🚫 Usuario No Autenticado", () => {
    it("Debe redirigir al login si no hay token", () => {
      cy.clearLocalStorage();
      cy.visit(HOME_URL);
      cy.url().should("include", "/login");
    });
  });

  context("✅ Usuario Autenticado (Token Real)", () => {
    
    beforeEach(() => {
      // 1. USAR CREDENCIALES REALES DE TU DB LOCAL
      // Cambia esto por un usuario que sepas que existe y funciona
      const email = "asd@gmail.com"; 
      const password = "asdasdasd";   

      // 2. Usamos nuestro comando mágico
      // Esto obtiene un token válido del backend y lo guarda en localStorage
      cy.loginAPI(email, password);
    });

    it("Debe renderizar el contenido del Dashboard correctamente", () => {
      // 3. Visitamos la home. 
      // Como el localStorage ya tiene un token VÁLIDO, el AuthContext lo aceptará.
      cy.visit(HOME_URL);

      // 4. Validaciones visuales (usando los data-testid de tu Home.tsx)
      cy.get('[data-testid="home-title"]')
        .should("be.visible")
        .and("contain", "Bienvenido");

      cy.get('[data-testid="home-description"]')
        .should("be.visible")
        .and("contain", "Frontend TP2");

      // Verificar tags
      cy.get('[data-testid="home-tags"]')
        .should("be.visible")
        .within(() => {
          cy.contains("Responsive").should("be.visible");
          cy.contains("Accesible").should("be.visible");
        });
    });

    it("Debe mostrar el estilo de gradiente", () => {
      cy.visit(HOME_URL);
      cy.get('[data-testid="home-gradient-bg"]')
        .should("have.class", "bg-gradient-to-r");
    });
  });
});