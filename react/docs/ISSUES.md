# Issues Spotted During Implementation

---

## 1. `vite.config.ts` missing `build.target: 'es2022'`

**Symptom:** Production build fails with:
```
Top-level await is not available in the configured target environment
("chrome87", "edge88", "es2020", "firefox78", "safari14" + 2 overrides)
```

**Root cause:** The plan's `vite.config.ts` snippet omits a `build.target` field. Vite's esbuild transform uses its own target (`es2020` by default) independently of `tsconfig.base.json`'s `"target": "ES2022"`. TypeScript's `target` only affects type-checking and IDE feedback; the actual code transform at build time is done by esbuild, which needs its own instruction.

**Fix applied:** Added `target: 'es2022'` to the `build` block in `app/vite.config.ts`:
```ts
build: {
  target: 'es2022',   // ← added; required for top-level await
  rollupOptions: { ... },
},
```

**Plan fix:** The `vite.config.ts` snippet in the Code Patterns section should include this field.

---

## 2. `reflect-metadata` imported in both `container/src/index.ts` and `main.tsx`

**Symptom:** Not a runtime error — both imports are idempotent. But the plan contradicts itself.

**Root cause:** The Key Decisions section states:
> "Import once as the very first line of `main.tsx`."

However, the Code Patterns snippet for `container/src/index.ts` also starts with `import 'reflect-metadata'`. A reader following the Key Decisions rule would put it only in `main.tsx`; a reader following the code snippet would put it in both.

**Current state:** Both files import it, which works. The container's import is defensive (ensures the polyfill is present even if something imports `@gaev/container` before `main.tsx` runs), so there is a practical argument for keeping it there.

**Plan fix:** Either remove `import 'reflect-metadata'` from the `container/src/index.ts` snippet and update the Key Decisions rationale, or update Key Decisions to say "imported in `container/src/index.ts`; no need to repeat in `main.tsx`" — and remove it from the `main.tsx` snippet.
