# قدّور — the picture prompts

**Easiest way to use this:** open **http://localhost:8080/mascot-prompts.html**
and click the Copy button next to each prompt. No selecting, no scrolling.

---

## How to use

1. Open GPT Image 2 (on fal.ai, or in ChatGPT).
2. **Attach one picture** — each step below tells you which one.
3. **Copy the prompt** and paste it in.
4. Save the picture you get.

**Do STEP 1 first.** Everything else copies from it, so if STEP 1 is wrong,
every one of them comes out wrong.

---

# STEP 1 — make the 3D قدّور

**Attach:** the flat drawing of قدّور.

**Do this once.** The picture you get here is the new قدّور. Look at it hard before
moving on — every prompt below says "copy the attached reference", so this one
image decides every state below.

One important thing: this is **not** a redesign. We are only turning the flat drawing
into 3D. Same man, same face, same shape, same tan vest. The prompt says so many times
because the model likes to "improve" him into a big-headed cartoon, and then he is not
him any more.

```
Use the attached illustration as the character reference. Convert THIS EXACT
DRAWING into a soft 3D render.

THE RULE THAT OVERRIDES EVERYTHING ELSE:
This is a MATERIAL and LIGHTING change only. It is NOT a redesign. The result must look
like someone built a 3D model of the attached drawing and photographed it — same man,
same proportions, same face, same shapes, same colours, same clothes, same pose. If you
find yourself changing anything about how he is BUILT, stop: you have gone too far.

DO NOT STYLISE HIM FURTHER. Specifically:
- Do NOT make him chibi, super-deformed, big-headed or figurine-like.
- Do NOT change the head size. In the drawing his head WITH THE HAIR is nearly HALF of
  his total height. Keep exactly that ratio.
- Do NOT make him taller, slimmer or longer-legged. He is stocky and wide, with short
  legs and a broad torso. Keep exactly that build.
- Do NOT enlarge the eyes. Keep them exactly as drawn: modest, calm, half-lidded, the
  upper lid resting over the top of the iris. That relaxed look is his personality.
- Do NOT shorten the arms or legs. He has normal adult limbs.
- Do NOT change any colour. The vest is TAN, not green.
- Do NOT simplify his hair into a solid blob, and do NOT grey out his beard.

COPY EXACTLY FROM THE REFERENCE, feature by feature:
- Voluminous black curly hair sitting high and wide, RECEDING at the temples so the
  forehead is tall and bare at the front, with softer dark-grey curls mixed in at the back.
- Thick straight black eyebrows, set high above the glasses.
- Large round glasses, thin translucent pale-cream rims, resting low on the nose.
- Half-lidded eyes: wide white sclera, round black pupils, the upper lid coming down over
  the top of each pupil. Calm, not sleepy, not wide.
- Small rounded tan nose. Warm light-tan skin. One tan ear visible on the viewer's right.
- Black moustache curving down around the mouth into a black beard along the jaw, with a
  distinct narrow SILVER-GREY streak in the centre of the chin and grey at the sideburns.
- Open smiling mouth showing white upper teeth and a red inner mouth.
- White shirt, collar open in a V, sleeves rolled to just below the elbow, softly puffed.
- TAN / camel knit V-neck sweater vest with a fine ribbed edge at the V and the hem, and
  one small dark button at the waist.
- Dark olive-brown straight trousers. Chunky black shoes with a lighter brown cuff above.
- One long thin dark pointer stick, angled up and out to the viewer's upper LEFT, held in
  a complete arm — shoulder to hand, nothing floating.
- One purple hardcover book held against his side in the other complete arm, spine facing
  the viewer's left, the pages a lighter lilac edge.
- A simple soft pale-grey shadow on the ground under his shoes.

THE ONE INTENTIONAL CHANGE — everything else is copied:
- The book cover reads "قدرات" in white, with two or three small white maths symbols
  (+ ÷ ×) beneath it. Ignore whatever text is on the book in the reference.

RENDER IN SOFT 3D:
- Matte clay-like surfaces. Rounded volumetric forms with generous fillets, no sharp edges.
- Soft even studio lighting from slightly above and in front, gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where the arms meet the torso.
- NO gloss, NO hard specular highlights, NO rim light, NO reflections. Matte only.
- Very soft shadows, no hard shadow edges.
- No fabric wrinkles, no skin texture, no individual hair strands, no fine surface detail.
  It must still read clearly when shrunk to 96 pixels tall.

BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge,
exactly like the reference drawing. NEVER a gradient, NEVER a vignette, NEVER a glow, and
never his shadow cast onto it — he is cut out by flooding in from the corners, and only a
perfectly flat colour cuts cleanly.

FRAMING: one character only, centred, full body from hair to shoes, nothing cropped,
generous empty margin on all four sides. No text except "قدرات" on the book. No scenery,
no second character, no frame, no caption. Square 1:1, highest available resolution.
Stylised cartoon character, NOT photo-realistic, NOT a real human.
```

### Is it good? Check these 9 things

Say yes to all nine, or generate again:

1. Put it next to the drawing — same man, and the shapes line up.
2. Normal grown-up body. **Not** big-headed, **not** a chibi doll.
3. Eyes the same size as the drawing, still calm and half-closed.
4. Hairline still going back at the sides, hair still curls — not one black blob.
5. The vest is still **tan**. Not green.
6. The grey in his beard is still a thin streak on the chin, not a grey beard.
7. Matte, like clay. Not shiny plastic.
8. Background is one flat colour edge to edge — no gradient, no glow.
9. The book says **قدرات**, spelled right, not backwards.

Number 8 matters more than it looks: he is cut out by sampling the corner colour and
flooding inward, so one flat colour cuts perfectly and a gradient does not cut at all.
A dark background is fine — measured, it loses nothing. Unevenness is what breaks it.

Happy with it? Save it as **qaddour-3d.png** and go to STEP 2.

---

# STEP 2 — make the 17 states

**Attach:** the 3D قدّور you just approved. **Not** the flat drawing.

One prompt = one picture. They are in the order you should make them — the first
four are the ones the app uses all day, so stop after those if you want to see him
in the app early.


## 1. `stand`

Standing beside the lesson path — his idle, the pose Duo holds on Duolingo's path

Save as **qaddour-stand.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: standing still beside the lesson path, doing nothing, simply present — the same
plain standing pose Duolingo's owl holds on its path. Calm, friendly, at rest. This is his
IDLE: he is scenery the student walks past, not a character performing an action.
CAMERA: STRAIGHT-ON FRONT VIEW at his own eye level. He faces the viewer squarely, both
shoulders level and square to the camera, nose pointing straight at the lens. NOT a
three-quarter angle, NOT turned to one side, NOT seen from above, NOT seen from below.
BODY: upright and symmetrical, standing at full height, weight even on both feet, feet
flat on the ground and a little apart. No leaning, no twisting, no walking, no action.
EYES: his normal calm half-lidded look, aimed straight at the viewer.
MOUTH: a small closed friendly smile. Relaxed — not a grin, not laughing.
ARMS: both complete arms hanging relaxed at his sides, close to the body, elbows almost
straight. The hand on the VIEWER'S LEFT holds the pointer stick vertically, pointing
straight DOWN beside his leg — NOT raised, NOT pointing at anything.
BOOK: held against his side in the other hand, low, near his hip.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 2. `point`

The hero pose — path, modals, exam setup

Save as **qaddour-point.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: mid-explanation, addressing the viewer. This is his signature pose and the one
that appears beside the lesson path, so it must be the most appealing of the set.
EYES: wide open, bright and assured, looking straight at the viewer.
MOUTH: open in a warm mid-speech smile.
ARMS: the arm holding the pointer stick is raised and extended up and outward, COMPLETE
from shoulder through elbow to the hand, the stick angled up at about 45 degrees as if
indicating something off-frame. The other complete arm holds the book at his side.
BODY: confident, shoulders square, weight settled.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 3. `encourage`

Wrong answer — the most-used state in the app

Save as **qaddour-encourage.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: gently reassuring a student who just got an answer wrong. Kind and completely
unbothered. He is NOT angry, NOT scolding, NOT disappointed.
EYES: wide open and soft, warm, slightly crinkled at the outer corners. Eyebrows raised
gently in the middle, sympathetic.
MOUTH: closed, a small warm reassuring smile.
ARMS: his free arm reaches FORWARD toward the viewer, complete from shoulder to an open
palm turned UP at chest height — a calm "it is alright, let us look again" gesture. His
other complete arm hangs at his side holding the pointer stick, angled down.
BOOK: tucked under the arm holding the stick.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 4. `cheer`

Correct answer

Save as **qaddour-cheer.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: delighted, cheering the student's success.
EYES: AS WIDE OPEN AS THEY GO, pupils large, bright catchlights. This is the biggest,
happiest expression in the set apart from `celebrate`. Eyebrows raised high.
MOUTH: wide open in a big joyful laughing smile.
ARMS: BOTH arms raised above his head, both complete from shoulder to hand. One hand
grips the pointer stick, angled up like a raised baton.
BODY: leaning slightly back, one heel lifted with the momentum.
BOOK: clamped under one raised arm, tilted with the motion.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 5. `wave`

Login / welcome hero — the first impression

Save as **qaddour-wave.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: greeting the viewer warmly. This is the first thing a new student ever sees,
so it must be the friendliest image in the set.
EYES: wide open and bright, crinkled at the outer corners in a genuine smile.
Eyebrows raised evenly.
MOUTH: open in a big warm friendly smile.
ARMS: his free arm raised so the open palm is at head height facing the viewer,
mid-wave — complete from shoulder to hand. The other complete arm hangs at his side
holding the pointer stick, angled down.
BODY: weight on one leg, turned slightly toward the viewer, head tilted slightly.
BOOK: under the arm holding the stick.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 6. `concerned`

Fail screen, streak at risk

Save as **qaddour-concerned.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: worried ABOUT the student's progress, the way a teacher worries before an exam.
He is worried FOR them, never angry AT them. No disapproving frown, no crossed arms,
no wagging finger.
EYES: wide open but soft and downcast, looking down and to the side. Eyebrows drawn
together and tilted UP at the inner ends — the classic worried, sympathetic brow.
MOUTH: closed, a small flat, slightly downturned line. Not a scowl.
ARMS: his free arm raised so the hand rests against his own cheek in a worried gesture,
complete and clearly connected from shoulder to hand. The other complete arm hangs low,
the pointer stick held loosely and forgotten.
BODY: shoulders slightly slumped.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 7. `proud`

Three stars, no mistakes left

Save as **qaddour-proud.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: quietly, deeply proud of the student. Warm and understated, not showy.
EYES: wide open and warm, strongly crinkled at the outer corners. Eyebrows relaxed.
MOUTH: closed, a broad satisfied smile pushing the cheeks up.
ARMS: BOTH arms folded across his chest resting on the book he hugs to himself, both
complete and clearly joined at the shoulders. The pointer stick is tucked under one
folded arm.
BODY: chin lifted slightly, chest out, weight even. Confident and contented.
BOOK: held flat against the chest, cover facing the viewer so "قدرات" stays readable.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 8. `celebrate`

Rank-up ceremony — the biggest moment in the app

Save as **qaddour-celebrate.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: ecstatic. The single biggest celebration in the whole set, bigger than `cheer`.
EYES: enormous and wide open, pupils large, bright catchlights, eyebrows as high as
they go.
MOUTH: wide open in a full joyful laugh.
ARMS: BOTH arms flung straight up overhead in a full victory pose, both complete from
shoulder to hand. One hand raises the pointer stick triumphantly.
BODY: caught mid-jump, both heels off the ground, body arched back with the momentum.
BOOK: clamped under one arm.
EXTRA: small confetti pieces in green, gold, purple and blue in the air CLOSE around his
body, not spread toward the edges of the frame.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 9. `teach`

The method sheet — every 'how do I solve this'

Save as **qaddour-teach.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: mid-explanation, walking a student through a solution step by step.
EYES: wide open and focused, looking down toward the open book. Eyebrows level and
engaged.
MOUTH: open in mid-speech.
ARMS: BOTH arms complete and brought together in front of him at chest height, both
hands holding the purple book OPEN, spine toward the viewer so the open pages show from
the side, tilted slightly toward the viewer. Leaning forward as if reading aloud.
BOOK: the ONE book, now OPEN in both hands — same purple cover, darker purple spine,
blank cream pages. It is not also under his arm.
STICK: the ONE pointer stick, tucked under one arm.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 10. `think`

Loading state

Save as **qaddour-think.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: thinking something over, considering a problem.
EYES: wide open, glancing UP and away to the viewer's left. One eyebrow raised higher
than the other.
MOUTH: closed, pushed slightly to one side in a pensive purse.
ARMS: his free arm raised so the hand reaches his chin and the fingers stroke the beard,
complete and connected from shoulder to hand. The other complete arm holds the pointer
stick VERTICALLY, its tip resting on the ground like a walking cane.
BODY: head tilted, weight on the back leg.
BOOK: under the arm holding the cane.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 11. `timeup`

Time-up feedback, section timeout

Save as **qaddour-timeup.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: mildly alarmed that the time has run out. Urgent but not panicked, not angry.
EYES: very wide, eyebrows raised high — surprise, not anger.
MOUTH: open in a small round "oh".
ARMS: his free arm raised so the hand holds a round wall clock up at head height, turned
so the clock face is visible to the viewer — the arm complete from shoulder to hand. The
other complete arm is tucked in holding the pointer stick.
EXTRA: a simple round analogue wall clock, cream face, two black hands, thin dark rim.
The clock face carries NO numerals and NO text.
BOOK: under the arm holding the stick.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 12. `strong`

Exam-day cheer, first mock

Save as **qaddour-strong.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: determined and encouraging, pumping the student up.
EYES: wide open, focused and intense, eyebrows lowered in determination — determined,
NOT angry.
MOUTH: closed, a confident lopsided grin pulled to one side.
ARMS: one arm raised and bent hard at the elbow in a bicep-flex, that hand in a fist,
the sleeve pushed up on that arm — the whole arm complete and clearly connected. The
other complete arm holds the stick and book tucked at his side.
BODY: chest out, chin up, feet planted wide and firm.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 13. `calm`

Mid-mock breather

Save as **qaddour-calm.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: serene and calming, inviting the viewer to breathe and settle.
EYES: fully CLOSED, drawn as two gentle downward-curving arcs, serene. Eyebrows relaxed
and level. (This is one of only two closed-eye states — it must read as peaceful, not
asleep.)
MOUTH: closed, a small tranquil smile.
ARMS: BOTH arms lowered in front of him at waist height, both complete from shoulder to
hand, both palms facing DOWN in a slow calming "settle" gesture. Shoulders dropped.
BODY: upright and centred, both feet planted evenly.
BOOK and STICK: both tucked under one arm.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 14. `sleep`

Chest cooldown, daily question done

Save as **qaddour-sleep.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: dozing standing up, peaceful. Not exhausted, not sad — content and sleepy.
EYES: fully CLOSED as two simple downward-curving arcs. Eyebrows relaxed high.
MOUTH: closed, a tiny peaceful smile.
ARMS: both arms hang loose and complete at his sides, one hand still loosely holding the
pointer stick angled down.
BODY: slouched, head tipped onto one shoulder, shoulders dropped, weight sagging onto
one leg.
EXTRA: three small grey "z" letters of increasing size floating up from beside his head,
kept close to his head.
BOOK: under one arm.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 15. `stop`

Quit-lesson intercept, destructive reset

Save as **qaddour-stop.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: pleading with the viewer not to leave. Earnest and a little anxious, never angry.
EYES: very wide open, eyebrows tilted UP at the inner ends, imploring.
MOUTH: open in a small worried "wait!" shape.
ARMS: his free arm reaches FORWARD toward the viewer, complete from shoulder to hand,
palm out flat in a "stop, wait" gesture. The other complete arm trails behind holding the
pointer stick.
BODY: turned three-quarters away toward the viewer's left as if the viewer is walking
off, head and torso twisted back to face the viewer. Leaning forward, one foot stepping
toward the viewer.
BOOK: under the trailing arm.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 16. `crown`

Max league tier

Save as **qaddour-crown.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: humbly pleased at having reached the very top.
EYES: wide open and warm, crinkled at the outer corners. Eyebrows raised.
MOUTH: closed, a modest pleased smile.
ARMS: a small self-effacing shrug — shoulders lifted, his free arm complete from shoulder
to an open hand turned palm-up at hip height. The other complete arm holds the pointer
stick lowered at his side.
BODY: standing tall, head tilted slightly.
EXTRA: a small gold crown with three rounded points sitting on top of his curly hair.
BOOK: under the arm with the stick.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## 17. `oops`

Error / empty / data-not-loaded states

Save as **qaddour-oops.png**

```
=== RULE 0 — DO NOT CHANGE THE STYLE ===

The attached image is the FINAL character AND the FINAL art style. Copy BOTH exactly.

- Do NOT change the ART STYLE. Same 3D look, same matte finish, same lighting, same
  amount of detail, same soft rounded shapes as the attached image.
- Do NOT change the CHARACTER. Same man, same face, same head shape, same hair, same
  beard, same glasses, same clothes, same colours as the attached image.
- Do NOT change his BUILD. Same height, same width, same head size, same body length,
  same arm length and same leg length as the attached image. Do NOT make him taller,
  slimmer, or longer-legged. He is stocky and wide, and his head with the hair is nearly
  HALF of his total height. Keep him exactly that shape.
- Do NOT "improve", "refine", "clean up", "modernise" or "stylise" anything.
- Do NOT redraw him from your own reading of the words below. The words are a CHECKLIST
  for the attached image, not a design brief. Where the words and the image disagree,
  THE IMAGE WINS.

The ONLY two things that may differ from the attached image are the POSE and the FACIAL
EXPRESSION described under POSE. Everything else is a straight copy.

=== RULE 1 — ONE FLAT BACKGROUND COLOUR ===

Fill the whole square with ONE FLAT SOLID COLOUR, edge to edge. Use #F5E9DA.

- Do NOT use a gradient, a vignette, a glow, or any lighting falloff on the background.
- Do NOT cast his shadow onto the background.
- The colour must be IDENTICAL in all four corners and everywhere between them.

Reason: he is cut out by sampling the corner colour and flooding inward. One flat colour
cuts perfectly. A gradient drifts out of tolerance away from the corner and the cut fails.

Use the attached image as the character reference. Produce ONE image of this
character in a single pose, described under POSE below.

Copy the character EXACTLY as the reference shows him — same build, same proportions,
same face, same colours, same clothes, same props. He is the man in the reference, not
a new character in similar clothes. Do NOT redesign him, do NOT restyle him, do NOT
change his proportions. ONLY the POSE and the FACIAL EXPRESSION change.

CHARACTER — match the attached reference exactly:
- Soft 3D render. Matte, clay-like surfaces. Rounded volumetric forms, no sharp edges.
- Stocky and wide, exactly the build in the attached image: his head with the hair is
  nearly HALF his total height, his legs are short, his torso is broad. Do NOT stretch
  him into a tall slim figure.
- EYE SIZE is fixed by the reference — modest and calm, never big round anime eyes.
  How OPEN the lids are is set per state under POSE; the size never changes.
- Large round glasses with thin translucent pale-cream rims.
- Voluminous black curly hair, receding at the temples so the front of the forehead
  is bare and tall.
- Thick straight black eyebrows. Black moustache curving around the mouth into a black
  beard along the jaw, with a narrow silver-grey streak in the centre of the chin.
- Warm tan skin, small rounded nose.
- White shirt, collar open, sleeves rolled to below the elbow. TAN knit sweater vest
  with a V-neck. Dark olive-brown trousers. Chunky black shoes.
- Props: one thin dark pointer stick, held in the hand on the VIEWER'S LEFT. One purple
  book, cover reading "قدرات" in white with small white maths symbols.
- A soft contact shadow directly under his shoes.

ANATOMY — READ THIS TWICE. It is the most common failure.

Every arm must be COMPLETE and VISIBLY CONNECTED to the body:
shoulder -> upper arm -> elbow -> forearm -> hand, as one unbroken shape joined to the torso.

- NEVER draw a floating hand.
- NEVER draw a hand or a cuff with empty space between it and the shoulder.
- NEVER draw a pointer stick floating with no hand and arm holding it.
- NEVER amputate an arm at the sleeve. The rolled-up sleeve is PART of the arm.
- Exactly two arms and two hands. Every hand attached to an arm, every arm to a shoulder.

PROPS — exactly one of each:
- EXACTLY ONE pointer stick. Never two.
- EXACTLY ONE purple book. Never two. If he holds the book up, it is NOT also under his
  arm. One book, in one place.

POSE: apologetic — a small "sorry, nothing here" shrug. Light and unbothered.
EYES: wide open, looking slightly off to the viewer's left. Eyebrows raised, inner ends
tilted up apologetically.
MOUTH: closed, pushed to one side in a sheepish half-smile.
ARMS: BOTH shoulders raised in a full shrug, BOTH arms complete from shoulder to hand,
both hands turned palm-up and out at waist height.
BODY: head tilted.
BOOK and STICK: both tucked under one arm.

LAYOUT AND RENDER:
- ONE character only, centred, full body from hair to shoes, nothing cropped.
- Generous empty margin on all four sides.
- Soft even studio lighting from slightly above and in front. Gentle ambient occlusion
  where forms meet — under the chin, inside the V-neck, where arms meet the torso.
- Matte only. No gloss, no hard specular highlights, no rim light, no reflections.
- Very soft shadows. No hard shadow edges.
- Simple and chunky. NO fabric wrinkles, NO skin texture, NO individual hair strands,
  NO fine surface detail. It must read at 96 pixels tall.
- BACKGROUND: one completely flat solid #F5E9DA filling the whole square, edge to edge.
  NEVER a gradient, NEVER a vignette, NEVER a glow. See RULE 1.
- No text anywhere except "قدرات" on the book cover.
- No scenery, no furniture, no second character, no frame, no border, no caption.
- Square 1:1 aspect ratio, highest available resolution.
- Stylised cartoon character. NOT photo-realistic, NOT a real human.

DO NOT:
- Do NOT draw detached or floating hands, arms, cuffs or pointer sticks.
- Do NOT give him two books or two sticks.
- Do NOT redesign him or invent a new character. He is the man in the reference.
- Do NOT make him chibi, big-headed, short-limbed or figurine-like. His proportions are
  the reference's proportions.
- Do NOT enlarge the eyes. Opening the lids for an expression is fine; making the eyes
  themselves bigger is not.
- Do NOT recolour the vest. It stays TAN.
- Do NOT make the surfaces shiny or plastic-looking.
- Do NOT turn the silver chin streak into a grey patch or a full grey beard.
- Do NOT put him on a gradient, a vignette or a glow. One flat #F5E9DA, edge to edge.
- Do NOT change the art style, the level of detail, or the lighting.
- Do NOT add wrinkles, texture, or extra detail.
```

## When you have the pictures

Put them all in `assets/mascot/sheets/single/` named `qaddour-point.png`,
`qaddour-cheer.png` and so on, then run one command:

```
python tools/slice_mascot.py --single
```

That cuts out the background, makes them all the same size, and shrinks them.

## Check every picture before you keep it

1. Still a grown-up body, not drifting into a big-headed doll.
2. Eyes the same size as the reference. Open eyelids are fine — bigger eyes are not.
3. Vest still tan. It really wants to turn green.
4. Matte, not shiny.
5. Both arms whole, shoulder to hand. No floating hands or floating sticks.
6. One book, one stick.
7. Background one flat colour — a gradient or a glow breaks the cut-out.
8. The book says قدرات, spelled right, not backwards.
9. Show it to someone with no context and ask what he is feeling. `encourage` must
   not look angry. `concerned` must not look disappointed in you.

One rule for the app, not the prompt: **قدّور can never be flipped horizontally.**
Flipping reverses the Arabic on his book, and everyone reading this app can read it.

## For the developer

This file is generated. Edit `tools/mascot_prompts.py` and re-run it —
never edit `Mascotprompt.md` by hand, your changes will be overwritten.
It writes `Mascotprompt.md` and `mascot-prompts.html` from the same source, so the
two can never drift apart.
