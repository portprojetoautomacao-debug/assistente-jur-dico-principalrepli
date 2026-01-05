/**
 * Tests for Accordion component
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

describe("Accordion", () => {
  it("should render accordion with multiple items", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("should toggle content visibility when trigger is clicked", async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByText("Item 1");

    // Initially content should not be visible (hidden attribute)
    let content = screen.queryByText("Content 1");
    expect(content).toBeNull(); // Content is not in the DOM when closed

    // Click to open
    fireEvent.click(trigger);

    // After opening, content should be visible
    content = screen.getByText("Content 1");
    expect(content).toBeInTheDocument();
    expect(content).toBeVisible();

    // Click to close
    fireEvent.click(trigger);

    // After closing, content should be hidden again
    content = screen.queryByText("Content 1");
    expect(content).toBeNull(); // Content is removed from DOM when closed
  });

  it("should show chevron icon rotation when opened", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByRole("button");
    const chevron = trigger.querySelector("svg");

    expect(chevron).toBeInTheDocument();
    expect(chevron).not.toHaveClass("rotate-180"); // Should not be rotated initially

    // Click to open
    fireEvent.click(trigger);

    // After opening, check if trigger has data-state="open"
    expect(trigger).toHaveAttribute("data-state", "open");

    // The rotation is handled by CSS selector [&[data-state=open]>svg]:rotate-180
    // Since this is a CSS-in-JS approach, we can't easily test the computed style
    // But we can verify the data-state attribute is set correctly
  });

  it("should support multiple expanded items when type is multiple", () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger1 = screen.getByText("Item 1");
    const trigger2 = screen.getByText("Item 2");

    // Open first item
    fireEvent.click(trigger1);
    expect(screen.getByText("Content 1")).toBeVisible();

    // Open second item (should stay open)
    fireEvent.click(trigger2);
    expect(screen.getByText("Content 1")).toBeVisible();
    expect(screen.getByText("Content 2")).toBeVisible();
  });
});
