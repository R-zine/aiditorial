import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const navigation = vi.hoisted(() => ({ pathname: "/prompt" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("public application shell", () => {
  it("presents the primary editor and document workflows", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /a calmer way to edit/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open the editor/i })).toHaveAttribute(
      "href",
      "/prompt",
    );
    expect(screen.getByRole("link", { name: /edit a document/i })).toHaveAttribute(
      "href",
      "/batch",
    );
    expect(screen.getByText("No account")).toBeInTheDocument();
    expect(
      screen.getByText(/without a remote application server/i),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("marks the current navigation section and exposes every workspace", () => {
    navigation.pathname = "/prompt/saved-run";
    render(<Navbar />);

    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editor" })).toHaveClass(
      "nav-link-active",
    );
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute(
      "href",
      "/history",
    );
    expect(screen.getByRole("link", { name: "Batch" })).toHaveAttribute(
      "href",
      "/batch",
    );
  });

  it("renders the current copyright year and local-storage message", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeVisible();
    expect(screen.getByText(/local inference/i)).toBeVisible();
  });
});
