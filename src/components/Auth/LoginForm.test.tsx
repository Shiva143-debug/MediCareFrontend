import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginForm from "./LoginForm";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";
import '@testing-library/jest-dom';

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  it("renders login form inputs and button", () => {
    const mockContext: Partial<AuthContextType> = {
      login: vi.fn(),
      loading: false,
    };

    render(
      <AuthContext.Provider value={mockContext as AuthContextType}>
        <LoginForm onToggleForm={() => {}} />
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("shows error when submitting empty form", async () => {
    const mockContext: Partial<AuthContextType> = {
      login: vi.fn(),
      loading: false,
    };

    render(
      <AuthContext.Provider value={mockContext as AuthContextType}>
        <LoginForm onToggleForm={() => {}} />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText("Login"));

    expect(await screen.findByText("Please fill in all fields")).toBeInTheDocument();
  });
});
