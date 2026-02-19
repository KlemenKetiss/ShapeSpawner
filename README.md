# ShapeSpawner
This project is an interactive HTML Canvas–based application that simulates falling shapes within a defined rectangular area (canvas). Shapes are generated at a fixed interval, fall under gravity, and can be interacted with via mouse or touch input. 

Noting that this is a small task I used PIXI.Graphics for geometry and will cap the maximum number of shapes as a precausion for performance. As I am not redrawing and filling the graphics every tick it should be fine (Avoiding clearing and drawing).

Since we are always using shapes I decided to implement a small pool and draw once on creation/reuse. Active shapes are capped at a number that I have not decided yet which makes performance and memory predictable.

With this assignment I decided to use a simple loop where gravity is applied every frame. This allows me to change gravity mid flight.

Why I don't use GSAP in this task?
Gsap animation in this case would be awkward (Pausing/Resuming animation, Syncing Gsaps internal time and Games time, Recalculating duration of animation on gravity change or killing tweens and recreating them from current position with new params).
We also need to think about disposal of these objects (Tween per object or multiple per object if we add rotation during fall). If we don't clear references and kill tweens properly memory leak is very much possible.
