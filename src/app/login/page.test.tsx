import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

vi.mock("next/link", async () => {
  const { default: Link } = await import("@/test/mocks/next-link");
  return { default: Link };
});

import LoginPage from "./page";

function stubLocationHref() {
  let href = "http://localhost/";
  const loc = {
    get href() {
      return href;
    },
    set href(v: string) {
      href = v;
    },
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  } as unknown as Location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: loc,
    writable: true,
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubLocationHref();
    signInMock.mockResolvedValue({
      error: undefined,
      status: 200,
      ok: true,
      url: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an alert when credentials are invalid", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValueOnce({
      error: "CredentialsSignin",
      status: 401,
      ok: false,
      url: null,
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "bad@example.com",
      password: "wrong",
      redirect: false,
    });
  });

  it("redirects to admin after successful sign-in", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValueOnce({
      error: undefined,
      status: 200,
      ok: true,
      url: null,
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await vi.waitFor(() => {
      expect(window.location.href).toBe("/admin");
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "admin@example.com",
      password: "secret",
      redirect: false,
    });
  });

  it("renders back link to home", () => {
    render(<LoginPage />);
    const back = screen.getByRole("link", { name: /back to staybook/i });
    expect(back).toHaveAttribute("href", "/");
  });
});
