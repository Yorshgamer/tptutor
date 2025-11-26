import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // 🎯 TU PUERTO DE REACT (Vite suele ser 5173, CRA 3000)
    baseUrl: "http://localhost:5173", 
    
    // Ancho de pantalla estándar para desktop
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Evita fallos por inestabilidad de red en CI/CD
    defaultCommandTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});