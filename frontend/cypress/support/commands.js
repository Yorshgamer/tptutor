// cypress/support/commands.js

/**
 * Comando personalizado para loguearse vía API (Backend Real)
 * Evita tener que pasar por la UI de Login en cada test.
 * @param {string} email
 * @param {string} password
 */
Cypress.Commands.add("loginAPI", (email, password) => {
  // 1. Hacemos la petición real a tu Backend
  cy.request({
    method: "POST",
    url: "/api/auth/login", // Cypress usará la baseUrl configurada
    body: {
      email: email,
      password: password,
    },
  }).then((response) => {
    // 2. Verificamos que el backend respondió bien
    expect(response.status).to.eq(200);
    
    // 3. Extraemos el token y el usuario de la respuesta real
    const { token, user } = response.body.data;

    // 4. Los inyectamos en el localStorage del navegador
    // Esto engaña a tu AuthContext haciéndole creer que el usuario ya entró.
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("user", JSON.stringify(user));
  });
});