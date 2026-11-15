export default defineAppConfig({
  ui: {
    colors: {
      primary: "emerald",
      neutral: "zinc",
    },
  },
  header: {
    title: "vvirtual-grid",
  },
  socials: {
    npm: "https://www.npmjs.com/package/vvirtual-grid",
  },
  toc: {
    title: "On this page",
    bottom: {
      title: "Web platform",
      links: [
        {
          icon: "i-lucide-accessibility",
          label: "ARIA list pattern",
          to: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/list_role",
          target: "_blank",
        },
        {
          icon: "i-lucide-message-square",
          label: "Popover API",
          to: "https://developer.mozilla.org/en-US/docs/Web/API/Popover_API",
          target: "_blank",
        },
        {
          icon: "i-lucide-anchor",
          label: "CSS anchor positioning",
          to: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning",
          target: "_blank",
        },
      ],
    },
  },
  github: {
    url: "https://github.com/astraldev/vvirtual-grid",
    branch: "main",
    rootDir: "docs",
  },
});
