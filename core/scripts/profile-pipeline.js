import { pipeline, createPageProvider } from "./pipeline.js";
import { of, firstValueFrom, filter } from "rxjs";
import logger from "consola";

async function runProfile() {
  // Give the profiler a moment to attach
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockWindow = {
    innerWidth: 1024,
    innerHeight: 768,
    getComputedStyle: () => ({
      getPropertyValue: (prop) => {
        if (prop === "grid-auto-flow") return "row";
        if (prop === "grid-template-columns") return "100px ".repeat(10).trim();
        if (prop === "grid-template-rows") return "100px ".repeat(10).trim();
        return "0";
      },
    }),
  };

  // Set up globals that the package expects
  global.window = mockWindow;
  global.getComputedStyle = mockWindow.getComputedStyle;

  const length = 1_000_000;
  const pageSize = 1000;
  const workoadSize = 500; // 500 times

  logger.start(`Starting workload test (${workoadSize} iterations)...`);
  const pageProvider = createPageProvider(Array.from({ length }));

  const input = {
    length$: of(length),
    pageProvider$: of(pageProvider),
    pageProviderDebounceTime$: of(0),
    pageSize$: of(pageSize),
    itemRect$: of({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    rootResize$: of({
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 1024,
        height: 768,
      }),
      offsetLeft: 0,
      offsetTop: 0,
    }),
    scroll$: of({
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 1024,
        height: 768,
      }),
      offsetLeft: 0,
      offsetTop: 0,
    }),
    respectScrollToOnResize$: of(true),
    scrollTo$: of(undefined),
  };

  logger.info("Starting pipeline");
  for (let i = 0; i < workoadSize; i++) {
    const { ready$, recompute } = await pipeline(input);
    await firstValueFrom(ready$.pipe(filter((v) => v === true)));
    await recompute();
    if (i % 100 === 0) logger.success(`Progress: ${i}/${workoadSize}`);
  }

  logger.log("");
  logger.success("Workload completed");
}

await runProfile();
