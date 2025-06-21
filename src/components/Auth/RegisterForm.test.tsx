import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RegisterForm from "./RegisterForm";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("RegisterForm", () => {
  it("renders all form fields", () => {
    const mockContext: Partial<AuthContextType> = {
      register: vi.fn(),
      loading: false,
    };

    render(
      <AuthContext.Provider value={mockContext as AuthContextType}>
        <RegisterForm onToggleForm={() => {}} />
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("shows error if passwords don't match", async () => {
    const mockContext: Partial<AuthContextType> = {
      register: vi.fn(),
      loading: false,
    };

    render(
      <AuthContext.Provider value={mockContext as AuthContextType}>
        <RegisterForm onToggleForm={() => {}} />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password456" } });

    fireEvent.click(screen.getByText("Register"));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  });
});
