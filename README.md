<img width="1122" height="907" alt="image" src="https://github.com/user-attachments/assets/1585da25-ece2-46e1-b6a1-8820f28f3814" />
# Shape Spawner

Interactive canvas application that simulates falling shapes in a playfield. Shapes spawn at a rate, fall under gravity, and can be removed by clicking or spawned by clicking empty space. Built with [PixiJS](https://pixijs.com/) v8 and [Vite](https://vitejs.dev/).

## Running locally

**Prerequisites:** [Node.js](https://nodejs.org/) (v18+ recommended).

1. **Clone and enter the repo**
   ```bash
   git clone https://github.com/KlemenKetiss/ShapeSpawner.git
   cd ShapeSpawner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open the URL shown in the terminal (e.g. `http://localhost:5173`) in your browser.

**Other commands:**
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — serve the production build locally

---

## Project structure

```
ShapeSpawner/
├── index.html              # Entry HTML (canvas container, controls, HUD placeholders)
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts             # Bootstrap: creates Controls, Game, wires getters
    ├── styles.css          # Layout, controls, HUD, credits, mobile/safe-area
    ├── config/
    │   └── constants.ts    # Playfield size, gravity levels, spawn limits, colors
    ├── core/
    │   ├── Game.ts         # Pixi app, playfield, pointer handling; owns ShapeSpawner
    │   ├── ShapeSpawner.ts # Spawn/despawn logic, pool, active shapes, hit-test
    │   └── Viewport.ts     # fitPlayfieldToView (scale + letterbox)
    ├── shapes/
    │   ├── index.ts        # Re-exports IShape, Shape, shapeGeometry, types
    │   ├── IShape.ts       # Shape interface (update, getArea, containsPoint, etc.)
    │   ├── Shape.ts        # Concrete shape: physics, displayObject, pool reset
    │   ├── shapeGeometry.ts# Geometry + drawShape (params → polygon, area, bounds)
    │   └── types.ts        # ShapeKind, Point, Rect
    ├── ui/
    │   ├── Controls.ts     # Spawn / Gravity / Shape size ± with hold-repeat; getters
    │   └── Hud.ts          # updateHud(shapes, playfieldRect, { countEl, areaEl })
    └── utils/
        └── geometry.ts     # clipPolygonAgainstRect, polygonArea (Sutherland–Hodgman)
```

---

## About the project

This project is an interactive HTML Canvas–based application that simulates falling shapes within a defined rectangular area (canvas). Shapes are generated at a fixed interval, fall under gravity, and can be interacted with via mouse or touch input. 

Noting that this is a small task I used PIXI.Graphics for geometry and will cap the maximum number of shapes as a precausion for performance. As I am not redrawing and filling the graphics every tick the performance stays good (Avoiding clearing and drawing).

Since we are always using shapes I decided to implement a pool and draw once on creation/reuse. Active shapes are capped at 250 which makes performance and memory predictable also this makes it unexploitable with autoclicker.

With this assignment I decided to use a simple loop where gravity is applied every frame. This allows me to change gravity mid flight.

I tested the application on mobile devices and ensured stable performance also taking into account safety margins.

I decided on using a MVC type pattern for implementation, making use of good practices and coding standards.

# How I structured the MVC design pattern
Models: Shape, ShapeSpawner for model + Settings from HTML elements and Getters rather than dedicated models
Views: Canvas and shape displayObjects, Viewport, Html elements with CSS
Controller: Game, Controls, Buttons that update values

# Why I don't use GSAP in this task?
This may be obvious. Gsap animation in this case would be awkward (Pausing/Resuming animation, Syncing Gsaps internal time and Games time, Recalculating duration of animation on gravity change or killing tweens and recreating them from current position with new params).
We also need to think about disposal of these objects (Tween per object or multiple per object if we add rotation during fall). If we don't clear references and kill tweens properly memory leak is very much possible.
