/**
 * backend/__tests__/setupMocks.js
 *
 * Centraliza los mocks para los tests unitarios.
 */
import { jest } from "@jest/globals";

// Mock de modelos
export const Project = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  // otras funciones que uses
};

export const ReadingActivity = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
};

export const ReadingResult = {
  create: jest.fn(),
  distinct: jest.fn(),
};

export const User = {
  findById: jest.fn(),
};

// TutorAssignment si se usa en tests
export const TutorAssignment = {
  find: jest.fn(),
  create: jest.fn(),
};

// Mocks para utils externos
export const notifyReadingCompleted = jest.fn();
export const ollamaRequest = jest.fn();

// Helper para resetear entre tests
export function resetAllMocks() {
  Object.values({ Project, ReadingActivity, ReadingResult, User, TutorAssignment }).forEach(
    (m) => {
      if (m && typeof m === "object") {
        Object.values(m).forEach((fn) => {
          if (fn && fn.mockReset) fn.mockReset();
        });
      }
    }
  );
  if (notifyReadingCompleted && notifyReadingCompleted.mockReset) notifyReadingCompleted.mockReset();
  if (ollamaRequest && ollamaRequest.mockReset) ollamaRequest.mockReset();
}
