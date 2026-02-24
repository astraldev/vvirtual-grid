import {
  getGridMeasurement,
  getResizeMeasurement,
  getContentSize,
} from "../src/pipeline";
import { describe, it, expect, vi } from "vitest";

function createGridRoot(
  rowGap: string = "10px",
  columnGap: string = "20px",
  gridAutoFlow: string = "row",
  gridTemplateColumns: string = "30px 30px 30px",
  gridTemplateRows: string = "30px 30px 30px",
): HTMLElement {
  const el = document.createElement("div");
  el.style.setProperty("row-gap", rowGap);
  el.style.setProperty("column-gap", columnGap);
  el.style.setProperty("grid-auto-flow", gridAutoFlow);
  el.style.setProperty("grid-template-columns", gridTemplateColumns);
  el.style.setProperty("grid-template-rows", gridTemplateRows);

  document.body.appendChild(el);

  return el;
}

describe("getGridMeasurement", () => {
  it("returns correct grid measurement in numbers", () => {
    const el = createGridRoot("10px", "20px", "row", "30px 30px 30px", "30px");
    const measurement = getGridMeasurement(el);

    expect(measurement).toEqual({
      rowGap: 10,
      colGap: 20,
      flow: "row",
      columns: 3,
      rows: 1,
    });
  });

  it("returns correct grid flow when flow is dense", () => {
    const el = createGridRoot("10px", "20px", "dense");
    const { flow } = getGridMeasurement(el);

    expect(flow).toBe("row");
  });

  it("returns correct grid flow when flow contains two words", () => {
    const el = createGridRoot("10px", "20px", "column dense");
    const { flow } = getGridMeasurement(el);

    expect(flow).toBe("column");
  });
});

describe("getResizeMeasurement", () => {
  it("returns correct grid measurement in numbers", () => {
    const el = createGridRoot("10px", "20px", "column", "30px", "20px 20px");

    const measurement = getResizeMeasurement(el, {
      width: 10,
      height: 20,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    } as DOMRectReadOnly);

    expect(measurement).toEqual({
      rowGap: 10,
      colGap: 20,
      flow: "column",
      columns: 1,
      rows: 2,
      itemHeightWithGap: 30,
      itemWidthWithGap: 30,
    });
  });
});

describe("getContentSize", () => {
  function createMockResizeMeasurement(flow: "row" | "column") {
    return {
      colGap: 10,
      rowGap: 10,
      flow: flow,
      columns: 5,
      rows: 5,
      itemHeightWithGap: 100,
      itemWidthWithGap: 100,
    };
  }

  it("returns correct content width", () => {
    const measurement = createMockResizeMeasurement("column");
    const contentSize = getContentSize(measurement, 1000);

    expect(contentSize).toEqual({ width: 19_990 });
  });

  it("returns correct content height", () => {
    const measurement = createMockResizeMeasurement("row");
    const contentSize = getContentSize(measurement, 1000);

    expect(contentSize).toEqual({ height: 19_990 });
  });
});
