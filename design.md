# Duolingo design system — cloned from the app's own files

This is Duolingo's design system as its Android app ships it. Three agents read it out of the decompiled APK
(`F:\Claude ( New Start )\Duolingo Study\decompiled\`) on 2026-10-26, one part each, and every value names the file and
line it came from. Nothing here is guessed from screenshots: what the files do not hold is listed as **not found**
at the end of each part. The working notes are in `Duolingo Study/notes/design/`, next to the earlier screen specs
(home path, lesson complete, leaderboard climb, onboarding) that these parts link to.

Units: 1 dp = 1 sp = 1 CSS px. Colour names are Duolingo's own (`juicyMacaw`, `juicySwan` …), each with its hex.

## How Qudrati uses this

- **This file describes Duolingo; `CLAUDE.md` describes Qudrati.** Where the user has already ruled on a screen
  in `CLAUDE.md`, the ruling wins over anything here: no confetti or particles, every bar is `.duo-bar`,
  every answer jumps and only answers do, the home screen is the live site's, the climb is Brilliant's, «·» is never a separator.
- **Arabic and RTL.** No Duolingo font has Arabic glyphs, so Duolingo Sans stays out and Baloo Bhaijaan 2 carries
  the type scale at the same sizes and weights. "Start" and "end" swap sides in RTL, as they do in the app on an Arabic phone.
- **The lip is the depth.** Duolingo draws buttons, cards, options, tiles and inputs with one mechanism: a face on
  a layer in its lip colour, which also shows as the border. Pressing drops the face by lip − border and leaves the
  bottom edge in place. Shadows are almost never used. Part II §0 has the CSS recipe.
- **Tokens in code.** Qudrati's `:root` variables in `css/style.css` already hold most of Part I's palette under
  its own names (`--green`, `--blue`, `--gold`, `--line` …). Use the variables, never a raw hex, when you build from this file.

## Contents

1. [Part I — Tokens](#part-i--tokens): colour (light and night), face → lip pairs, type, spacing, radii and lips, elevation, icons, CSS variables
2. [Part II — Components](#part-ii--components): the lip mechanism, buttons, cards and choices, progress bars, tooltips, the feedback sheet, bottom sheets, tab bar, stat bar, badges, inputs, checkbox and switch, dialogs, the path node
3. [Part III — Motion, sound, haptics and screen patterns](#part-iii--motion-sound-haptics-and-screen-patterns): easing and durations, press, transitions, answering, celebrations, sound by moment, haptic waveforms, screen anatomy, the voice of the copy

---

# Part I — Tokens


Every value below was read from the jadx output in `decompiled\`. Paths are relative to
`decompiled\resources\res\` (resources) or `decompiled\sources\` (Java). 1 dp = 1 CSS px, 1 sp = 1 CSS px.
"Derived" marks a number computed from values in the files, not written in them.

Short names used in the Source column:

| Short | Path |
|---|---|
| colors | `values\colors.xml` |
| colors-night | `values-night\colors.xml` |
| styles | `values\styles.xml` |
| styles-night | `values-night\styles.xml` |
| dimens | `values\dimens.xml` |
| attrs | `values\attrs.xml` |
| CardView | `sources\com\duolingo\core\design\juicy\ui\CardView.java` |
| JuicyButton | `sources\com\duolingo\core\design\juicy\ui\JuicyButton.java` |
| LipView | `sources\p000\hkn.java` (the interface CardView and JuicyButton both implement; it builds the face/lip drawable) |
| pvw | `sources\p000\pvw.java` (the styleable arrays: index → attr name) |

---

### 1. Colour

#### 1.1 How the palette works

- **Base colours** (`juicyOwl`, `juicyEel` …) are defined in colors and many are **redefined in colors-night**,
  so they flip in dark mode.
- **Sticky colours** (`juicySticky*`) have the same hex as their base colour but are **never redefined in
  colors-night** (colors-night defines no `juicySticky*` colour). They hold their light value in dark mode. They are
  used where a colour must not flip: text and icons on a coloured surface (`juicyStickySnow` is the most-used text
  colour in layouts, 171 uses), splash (`splash_bg` = `juicyStickyOwl`), unit themes (`unitThemeDuo` =
  `juicyStickyOwl`).
- **`juicySticky*Dark`** colours (`juicyStickySnowDark` #131f22, `juicyStickySwanDark` #37464f, `juicyStickyWolfDark`
  #dce6ec, `juicyStickyEelDark` #f1f7fb, `juicyStickyMacawDark` #49c0f8, `juicyStickyFlamingoDark` #945151) are the
  dark-mode values of the base colours, frozen as constants.
- The Compose side carries the same palette as raw ARGB longs: `sources\p000\wml.java` (light) and
  `sources\p000\yml.java` (dark) contain #fffffd, #f7f7f7, #e5e5e5, #afafaf, #777777, #4b4b4b, #58cc02, #58a700,
  #1cb0f6, #1899d6, #ff4b4b, #ea2b2b, #ffc800, #ff9600 … identical to the XML. One Compose colour, **#bb7149**, has
  no XML name.

Usage counts below are occurrences of `@color/<name>` in `layout*\`, `drawable*\` and style items, by attribute
(counted with a script over those folders).

#### 1.2 Brand and semantic colours, with their face → lip pairs

| Token | Light | Night | Role (from usages) | Source |
|---|---|---|---|---|
| juicyOwl | #58cc02 | #93d333 | Brand green. Face of `SolidGreenButton`; correct; progress `ProgressBarGreen` | colors, colors-night, styles |
| juicyTreeFrog | #58a700 | #79b933 | **Lip of Owl** (`SolidGreenButton`); correct text (`SelectableBlueCard selectedTextColor`, match tile correct text) | colors, colors-night, styles; `sources\com\duolingo\session\challenges\match\MatchButtonView.java` l.154 |
| juicySeaSponge | #d7ffb8 | #202f36 | Correct tint: face of `CorrectSecondaryButton` (via `juicyCorrectSecondaryButtonBackground`), correct match tile face | colors, styles, MatchButtonView l.154 |
| juicyTurtle | #a5ed6e | #5f8428 | **Lip of SeaSponge** (`CorrectSecondaryButton`, correct match tile) | styles, MatchButtonView l.154 |
| juicyMacaw | #1cb0f6 | #49c0f8 | Brand blue, the default action colour: face of `SolidButton`/`SolidBlueButton`/`SolidClickableCard`; text of `OutlineButton`, `Link`, `TinyText`; `colorAccent`; selected tab text | colors, styles, `color\juicy_tab_text_color.xml` |
| juicyWhale | #1899d6 | (none) | **Lip of Macaw** (`SolidButton`, `SolidBlueButton`, `SelectableBlueCard`); `Link` pressed text | styles, `color\juicy_link_text_blue.xml` |
| juicyIguana | #ddf4ff | #202f36 | Selected tint: default `selectedFaceColor` of CardView, `SelectableOutlineButton`, selected tab background, selected match tile face | CardView l.200, styles, `drawable\selected_tab.xml` |
| juicyBlueJay | #84d8ff | #3f85a7 | **Lip/border of Iguana** (default `selectedLipColor`, `selected_tab.xml` 2dp stroke) | CardView l.201, styles, selected_tab.xml |
| juicyHumpback | #2b70c9 | (none) | Dark blue: `CardCap` background | styles |
| juicyNarwhal | #1453a3 | (none) | Darker blue: text of `SolidStickyWhitePlusButton` | styles |
| juicyCardinal | #ff4b4b | #ee5555 | Brand red: face of `SolidRedButton`; `Error` text; wrong answer text; heart | colors, styles, `drawable\heart.xml` |
| juicyFireAnt | #ea2b2b | #d84848 | **Lip of Cardinal** (`SolidRedButton`); `IncorrectSecondaryButton` text (sticky) | styles |
| juicyWalkingFish | #ffdfe0 | #202f36 | Incorrect tint: face of `IncorrectSecondaryButton`, wrong match tile / challenge option face | styles, MatchButtonView l.153, `sources\com\duolingo\session\challenges\ui\ChallengeOptionView.java` l.72 |
| juicyFlamingo | #ffb2b2 | #945151 | **Lip of WalkingFish** in `IncorrectSecondaryButton` | styles |
| juicyPig | #f5a4a4 | (none) | **Lip of WalkingFish** in match tiles and challenge options | MatchButtonView l.153, ChallengeOptionView l.73 |
| juicyBee | #ffc800 | (none) | Gold: face of `SolidYellowButton`, legendary path node; crown | styles |
| juicyFox | #ff9600 | #ffab33 | Orange (streak): **lip of Bee** in `SolidYellowButton`; streak milestone background | styles, colors |
| juicyCamel | #e7a601 | (none) | **Lip of Bee** in `GoldSolidLegendaryButton` and `SpeakSofterFeedbackButton` | styles |
| juicyCanary | #fff5d3 | #202f36 | Yellow tint: face of `YellowSecondaryButton` | styles |
| juicyDuck | #fbe56d | (none) | **Lip of Canary** (`YellowSecondaryButton`) | styles |
| juicyGuineaPig | #cd7900 | #d79433 | Text on yellow (`YellowSecondaryButton`); legendary node icon (sticky) | styles |
| juicyStickyCowbird | #ae6802 | (sticky) | Text of `GoldSolidLegendaryButton` | styles |
| juicyBeetle | #ce82ff | (none) | Purple (unit theme Lily) | colors |
| juicyBetta | #9069cd | (none) | Deep purple: face of `SolidRampUpButton` (lip `#6438a8`, hardcoded), `BettaOutlineButton` (lip `juicyRampUpIntroBorder` #6a519c) | styles |
| juicyStarfish | #ff86d0 | (none) | Pink (unit theme Zari) | colors |
| juicyDragon | #cc348d | (none) | Magenta (unit theme Vikram) | colors |
| juicyPeacock | #00cd9c | (none) | Teal (unit theme Oscar) | colors |
| juicyGrizzlyLite | #dc8f47 | (none) | Brown (unit theme Falstaff) | colors |
| juicyStickyStarling | #5c6cfc | (sticky) | Indigo, no usage found | colors |
| juicyAnchovy | #d2e4e8 | (none) | Blue-grey, no usage found | colors |
| juicyStickyPrussian | #00244e | (sticky) | Navy, 1 usage | colors |
| juicyStickyLegendaryTextRest | #8c4103 | (sticky) | Max badge text/border (legendary) | colors, styles |

**Face → lip pairs, all in one place** (face first, then lip, then text):

| Component (style) | Face | Lip | Text | Source |
|---|---|---|---|---|
| SolidButton / SolidBlueButton / SolidClickableCard | Macaw #1cb0f6 | Whale #1899d6 | Snow | styles |
| SolidGreenButton | Owl #58cc02 | TreeFrog #58a700 | Snow | styles |
| SolidRedButton | Cardinal #ff4b4b | FireAnt #ea2b2b | Snow | styles |
| SolidYellowButton | Bee #ffc800 | Fox #ff9600 | Snow | styles |
| GoldSolidLegendaryButton, SpeakSofterFeedbackButton | Bee #ffc800 | Camel #e7a601 | StickyCowbird #ae6802 (legendary) | styles |
| SolidRampUpButton | Betta #9069cd | #6438a8 | StickySnow | styles |
| OutlineButton (secondary), cards (`_BaseCard`), SpeechBubble | Snow #fffffd | Swan #e5e5e5 | Macaw | styles |
| PointingCard, OutlineInput, InputCard | Polar #f7f7f7 | Swan #e5e5e5 | Eel | styles |
| Selected (SelectableOutlineButton, CardView default, selected match tile) | Iguana #ddf4ff | BlueJay #84d8ff | Macaw | styles, CardView l.200–202, MatchButtonView l.163 |
| Correct (CorrectSecondaryButton, match tile) | SeaSponge #d7ffb8 | Turtle #a5ed6e | TreeFrog #58a700 | styles, MatchButtonView l.154 |
| Incorrect (IncorrectSecondaryButton) | WalkingFish #ffdfe0 | Flamingo #ffb2b2 | FireAnt #ea2b2b | styles |
| Incorrect (match tile, challenge option) | WalkingFish #ffdfe0 | Pig #f5a4a4 | Cardinal #ff4b4b | MatchButtonView l.153 |
| YellowSecondaryButton | Canary #fff5d3 | Duck #fbe56d | GuineaPig #cd7900 | styles |
| White button on a coloured screen (SolidWhiteButton, StickyWhiteButtonMacaw) | Snow / StickySnow | White50 #80ffffff | Macaw | styles |
| StickyWhiteButtonMacawOpaque | StickySnow | StickyWhiteButtonLip #d0d5e0 | Macaw | styles |
| Path level node (all unit themes) | unit colour | **Black20 #33000000** (a 20% black overlay, not a named darker colour) | StickySnow icon | styles `LevelOval` |
| Legendary path node | Bee | GuineaPig50 #80cd7900 | StickyGuineaPig | styles `LevelOval.Legendary` |
| Locked path node | Swan | Black20 | Hare icon | styles `LevelOval.Locked` |
| Disabled JuicyButton | Swan (`disabledFaceColor` default) | none (drawn flat, at the pressed position) | Hare (`disabledTextColor` default) | JuicyButton l.146, l.154; LipView `m30623p` |

Unit theme faces (`unitTheme*` in colors): Duo = StickyOwl, Bea/Junior = StickyMacaw, Bluejay = StickyBlueJay,
Eddy = StickyCardinal, Lily = StickyBeetle, Lin/Lucy = StickyFox, Oscar = Peacock, Vikram = Dragon, Zari = Starfish,
Falstaff = GrizzlyLite, Legendary = Bee. Each unit also has a `unitShine*` colour at 30% (e.g. `unitShineDuo` =
`juicyStickySeaSponge30` #4dd7ffb8).

#### 1.3 Neutrals: backgrounds, borders, text

| Token | Light | Night | Role (from usages) | Source |
|---|---|---|---|---|
| juicySnow | #fffffd | #131f22 | **Page background** (`AppTheme android:windowBackground`, `colorBackground`); card/outline-button face; text on coloured buttons (`SolidButton` textColor) | colors, colors-night, styles |
| juicyWhite | #ffffff | (none) | Pure white, mostly icon fills in `LevelOval` | colors, styles |
| juicyPolar | #f7f7f7 | #202f36 | Secondary surface: face of inputs, `PointingCard`, `InputCard` | styles |
| juicySwan | #e5e5e5 | #37464f | **Borders, dividers and lips** of white/grey surfaces (101 `background` uses in layouts = 2dp divider lines), progress-bar track, disabled face | styles, `JuicyProgressBarView.java` l.172, CardView l.196 |
| juicyHare | #afafaf | #52656d | Disabled / inactive: disabled text, input hint (`Input textColorHint`), unselected tab, locked icons, close icon; most-used icon fill (232) | styles, `color\juicy_tab_text_color.xml`, `drawable\close_actionbar.xml` |
| juicyDove | #9d9d9d | #758289 | `Label` text colour | styles |
| juicyWolf | #777777 | #dce6ec | **Secondary text** (`Caption1`, hints in AutoComplete) | styles |
| juicyEel | #4b4b4b | #f1f7fb | **Primary text** (`Paragraph`, `PrimaryText`, `ChallengeText`; `black_text` = Eel, the app's default `textColorPrimary`) | styles, colors |
| juicyStickyDeepHare | #52656d | (sticky) | = Hare's night value | colors |
| juicyBlack | #000000 | (none) | Rare | colors |

#### 1.4 Alpha (overlay) colours

| Token | Value | Use | Source |
|---|---|---|---|
| juicyBlack10 / 15 / 18 / 20 / 40 / 50 | #19000000 / #26000000 / #2d000000 / #33000000 / #66000000 / #80000000 | Black20 = path node lip; Black50 = scrims (6 backgrounds) | colors, styles |
| juicySnow20 / 25 / 50 / 70 | #33fffffd / #40fffffd / #80fffffd / #b3fffffd | Snow25 = lip of `SpeechBubbleAboveCenter`; night Snow50/70 are #80131f22 / #b3131f24 | colors, colors-night |
| juicyStickySnow30 / 50 / 60 / 70 / 80 | #4dfffffd / #80fffffd / #99fffffd / #b3fffffd / #cdfffffd | Faded white text/lips on colour (StickySnow70 = streak milestone button lip) | colors |
| juicyWhite15 / 30 / 50 | #26ffffff / #4dffffff / #80ffffff | White50 = lip of white buttons on colour | colors, styles |
| juicySwan50 | #80e5e5e5 (night #8037464f) | | colors |
| juicyEel30 | #4d4b4b4b (night #4df1f7fb) | | colors |
| juicyMacaw30 | #4d1cb0f6 (night #4d49c0f8) | | colors |
| juicyOwl15 | #1a58cc02 (night #1a93d333) | | colors |
| juicyGuineaPig20 / 50, juicyStickyGuineaPig70 | #33cd7900 / #80cd7900 / #b3cd7900 | GuineaPig50 = legendary node lip | colors, styles |
| juicyStickyIguana30, juicyStickySeaSponge30, juicyStickyWalkingFish30 | #4dddf4ff, #4dd7ffb8, #4dffdfe0 | unit shines | colors |
| juicyBlueJay50 (night only) | #803f85a7 | | colors-night |
| juicyBackdrop30 | #4d244e61 | no usage found | colors |
| juicyTransparent | #00000000 | | colors |

#### 1.5 Remaining sticky colours (same hex as the base, never flip)

StickyBee #ffc800, StickyBeetle #ce82ff, StickyBetta #9069cd, StickyBlueJay #84d8ff, StickyCamel #e7a601,
StickyCanary #fff5d3, StickyCardinal #ff4b4b, StickyDove #9d9d9d, StickyDuck #fbe56d, StickyEel #4b4b4b (30 text
uses), StickyFireAnt #ea2b2b, StickyFlamingo #ffb2b2, StickyFox #ff9600, StickyGuineaPig #cd7900, StickyHare #afafaf
(disabled text on Plus/Super buttons), StickyHumpback #2b70c9, StickyIguana #ddf4ff, StickyMacaw #1cb0f6, StickyOwl
#58cc02, StickyPolar #f7f7f7, StickySeaSponge #d7ffb8, StickySnow #fffffd, StickyStarfish #ff86d0, StickySwan #e5e5e5,
StickyTreeFrog #58a700, StickyTurtle #a5ed6e, StickyWalkingFish #ffdfe0, StickyWhale #1899d6, StickyWolf #777777.
Source: colors.

#### 1.6 Product-specific juicy colours (Super, Plus, Max, Match Madness, Diamond league, Ramp Up)

Listed for completeness; not part of the core look. Night value after the slash when one exists. Source: colors,
colors-night.

- **Super**: Cosmos #3c4dff, Nebula #3f22ec (Cosmos button lip), Eclipse #000437, Celestia #ffffff, Gamma #26f663,
  GammaDark #26e183, Nova #cf17c8 / #fc55ff, Quasar #fc55ff, Starlight #268aff, Sapphire #cc235fdb,
  Cosmos30OnEclipse #121a73, DarkEel #f1f7fb, DarkWolf #dce6ec, CosmosButtonFace #3c4dff / #ffffff, CosmosButtonLip
  #3f22ec / #d2d2d2, CosmosButtonText #ffffff / #000437, CosmosText #3c4dff / #26f663, TransparentButtonText
  #3c4dff / #ffffff, FamilyPlanPromo Content #003055, Golden #ffd800, tab gradient #1b9cf7 → #4db3f2.
- **Plus**: Macaw #1cb0f6, Humpback #2b70c9, Narwhal #1453a3, MantaRay #042c60, Humpback30OnMantaRay #104080,
  BlueJay #84d8ff, Iguana #ddf4ff, Polar #f7f7f7, Snow #fffffd, Snow20 #33fffffd, Swan #e5e5e5, Wolf #777777;
  `juicy_blue_plus_dark` #0e3d79, `juicy_plus_white_button_lip` #dedede.
- **Match Madness**: Salmon/Background #ff7575 / #131f22, ExtremeOrange #f97700, ExtremeProgressBar #d46500, Logo
  #e06767, LogoCard #fbedd9, Redesign/Xp #ff5e5e, RowBlaster #ef5d5d, StatCard #e06767 / #202f36, StatColor #e54444,
  QuitButtonShadow #ccffffff / #80ffffff; `juicyNewMatchMadnessBackground` #ff4b4b.
- **Diamond league**: Surface #ffffff / #131f24, TagBackground #4bdddd, DemotionBackground #e7fbfb / #202f36,
  DemotionText #38d0d0 / #40b7b8, LightBlue #bcf5f3 / #6184c1, LightPink #fed3f8 / #b79db8, LightYellow #fff2a6 /
  #d0c88c, Gray01 #afafaf / #52656d, Gray07 #e5e5e5 / #37464f.
- **League preview**: Accent #afafaf / #52656d, Background01 #ffffff / #202f36, Background02 #e5e5e5 / #37464f,
  Outline #e5e5e5 / #52656d.
- **Ramp Up**: Dark #7047b0, MediumDark #7f59ba, IntroBorder #6a519c. **Epic suit**: FaceSelected #f4f0fa / #202633,
  Lip #ded2f0 / #5b5481, LipSelected #c8b4e6 / #64588e.
- Other: FacebookBlue #3b5998, AtomicDelightShine #f8fff2 / #52656d, ImmersiveSuperLilac #ebedff,
  WolfSocialScore #777777 / #cddce6ec, Wolf80 #cd777777 / #cddce6ec.

#### 1.7 Dark mode in one table

The surfaces and text that flip (colors-night). Everything not listed keeps its light value.

| Role | Token | Light | Night |
|---|---|---|---|
| Page | Snow | #fffffd | #131f22 |
| Raised / input surface | Polar | #f7f7f7 | #202f36 |
| Tints (Iguana, SeaSponge, WalkingFish, Canary) | | various | all #202f36 |
| Border / lip | Swan | #e5e5e5 | #37464f |
| Disabled | Hare | #afafaf | #52656d |
| Secondary text | Wolf | #777777 | #dce6ec |
| Primary text | Eel | #4b4b4b | #f1f7fb |
| Green / dark green | Owl / TreeFrog | #58cc02 / #58a700 | #93d333 / #79b933 |
| Blue / light blue | Macaw / BlueJay | #1cb0f6 / #84d8ff | #49c0f8 / #3f85a7 |
| Red / dark red | Cardinal / FireAnt | #ff4b4b / #ea2b2b | #ee5555 / #d84848 |
| Orange | Fox | #ff9600 | #ffab33 |

styles-night also changes: `AppBaseTheme` light status/nav bars off; `BettaOutlineButton` → Snow/Swan;
`ReactionCard` face → Eel; `LevelOval.Locked` → face Swan, icon colours #52656d / #6e848e / #637881.

---

### 2. Typography

#### 2.1 Font files

`res\font\` holds font files only (no font-family XML). Names read from each file's `name` table; Arabic coverage
tested on U+0627.

| File | Family (name table) | Weight | Notes |
|---|---|---|---|
| duolingosans_regular.otf | Duolingo Sans | 400 | v2.000 |
| duolingosans_medium.otf | Duolingo Sans | 500 | |
| duolingosans_bold.otf | Duolingo Sans | 700 | |
| duolingosans_medium_italic / bold_italic / black_italic.otf | Duolingo Sans | 500 / 700 / 900 italic | |
| duolingosans_variable.ttf, _variable_italic.ttf | Duolingo Sans | wght axis 100–900 | no reference found in Java sources |
| duolingosans_variable_italic_best_practice.ttf | Duolingo Sans Variable | wght 100–900 | |
| din_next_for_duolingo.otf / _medium / _bold | DIN Next for Duolingo | 400 / 500 / 700 | older; referenced by a few styles |
| duolingosansmath_*.ttf | Duolingo Sans Math | 100–900 (7 files) | maths content |
| roboto_medium_numbers.ttf | Roboto Medium | 500 | digits only |

Metrics (Duolingo Sans and DIN Next): unitsPerEm 1000, hhea ascent 925, descent −250, lineGap 200.
**No Duolingo font contains Arabic glyphs**, so Arabic text in the app falls back to the system font.

#### 2.2 Which font a text view actually gets

`JuicyTextView` and `JuicyButton` override `setTypeface` with `zm50.m52851a` (`sources\p000\zm50.java`), which
**replaces any typeface with Duolingo Sans** by weight: bold → `duolingosans_bold`, weight 500 →
`duolingosans_medium`, else `duolingosans_regular` (plus the italic cuts). So a style's `textStyle="bold"` (0x1)
means Duolingo Sans Bold (700), and `fontWeight 500` means Duolingo Sans Medium. JuicyTextView also calls
`setIncludeFontPadding(false)` (`JuicyTextView.java` l.150). Layouts use 1,617 JuicyTextViews and 579 JuicyButtons;
`textStyle="bold"` appears 254 times in layouts, `normal` 8. Default text: `App_TextAppearance` = 16sp
(`default_font_size` → `small_font_size`), colour `black_text` (= Eel).

#### 2.3 Text styles

All from styles. "Bold" = `android:textStyle 0x1`. Line height: an explicit `lineHeight` where the style has one;
otherwise `lineSpacingMultiplier`, which Android applies to the font's own line height (derived: ascent + descent =
1.175 × size with font padding off, so 1.2 × 1.175 ≈ 1.41 × size).

| Style | Size (sp) | Weight | Line height | Letter spacing | All caps | Colour | Parent |
|---|---|---|---|---|---|---|---|
| PageTitleLarge | 40 | bold | 44sp | – | – | inherit | – |
| PageTitleMedium | 32 | bold | 36sp | – | – | inherit | – |
| HeadingLarge | 28 | bold | 32sp | – | – | inherit | – |
| PageTitle | 26 (`large_text_size`) | 500, font din_next_bold | 28dp, +2sp extra | – | – | inherit | – |
| H1 | 25 | bold | ×1.2 | – | – | Eel | Paragraph |
| HeadingMedium | 24 | bold | 32sp | – | – | inherit | – |
| H2 | 19 | bold | ×1.2 | – | – | Eel | Paragraph |
| HeadingSmall | 20 | bold | 24sp | – | – | inherit | – |
| Body | 20 | regular | 28sp | – | – | inherit | – |
| BodyBold | 20 | bold | 28sp | – | – | inherit | Body |
| BodySpacious | 20 | regular | 32sp | – | – | inherit | – |
| GrammarHeader | 20 | bold | +9sp extra | – | – | Eel | Paragraph |
| PrimaryBody | 20 (`medium_text_size`) | regular, din_next | ×1.2 | – | – | Eel | – |
| PrimaryText | 20 | 500, din_next_medium | +8sp extra | – | – | Eel | – |
| **Paragraph** (the base) | 19 | regular | ×1.2 | – | – | Eel | – |
| ChallengeText / ChallengeRegularText | 19 (`challenge_text_size`) | light / regular (sans-serif) | – | – | – | Eel | – |
| H3 | 17 | bold | ×1.2 | – | – | Eel | Paragraph |
| Caption2 | 17 | regular | ×1.2 | – | – | Wolf | Caption1 |
| **Button / card cap text** (`_BaseTextStylesForButtonsAndCardCaps`) | 17 | bold | – | 0.05 | yes | per button | – |
| ToolbarItemText | 17 | bold | – | 0.05 | yes | inherit | – |
| Caption1 | 19 | regular | ×1.2 | – | – | Wolf | Paragraph |
| HeadingXSmall | 16 | bold | 20sp | – | – | inherit | – |
| Caption | 16 | regular | 24sp | – | – | inherit | – |
| CaptionBold | 16 | bold | 24sp | – | – | inherit | Caption |
| LabelMedium | 16 | bold | 16sp | 0.04 | yes | inherit | – |
| Subheading | 16 (`small_text_size`) | 700, din_next_bold | – | 0.04 | yes | inherit | – |
| Label | 16 | 500, din_next_medium | – | – | yes | Dove | – |
| SecondaryBody | 16 | 400, din_next | 24dp | – | – | Eel | – |
| SecondaryText | 16 | 500, din_next_medium | +8sp extra | – | – | Eel | – |
| CardCap | 15 | bold | – | 0.05 | yes | Snow on Humpback | button text |
| BadgeText | 15 | bold | – | 0.04 | yes | inherit | ToolbarItemText |
| Caption3 | 15 | regular | ×1.2 | – | – | Wolf | Caption1 |
| TinyText | 13 | regular | ×1.2 | – | – | Macaw | Paragraph |
| HintedText | 19 | regular | ×1.4 | – | – | Eel | Paragraph |
| Error | 19 | regular | ×1.2 | – | – | Cardinal | Paragraph |
| Link | 17 | bold | – | 0.05 | yes | Macaw (pressed Whale) | button text |

Other text dimens (dimens): `juicyTinyUppercase` 13sp, `juicyTransliterationFontSize` 15sp, `juicyLength1TextSize`
16sp, `juicyLength2AndHalfTextSize` 40sp, `juicyCharacterCard` 130sp, `juicyAutoSizeMinTextSize` 8sp,
`xsmall_font_size` 14sp, `small_font_size` 16sp, `medium_font_size` 18sp, `medium_text_size` 20sp,
`large_text_size` 26sp. Most-used text styles in layouts: Paragraph 195, Caption 32, HeadingMedium 21, LabelMedium
15, Body 15, HeadingSmall 14.

Not found: a Compose typography scale (the Compose design system under `core\design\compose\` is obfuscated and no
font-size table was located there).

---

### 3. Spacing

| Token | Value | Source |
|---|---|---|
| duoSpacing0 / 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 56 / 64 / 72 / 96 / 112 | 0 / 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 56 / 64 / 72 / 96 / 112 dp | dimens |
| juicyLengthEighth / Quarter / Third / Half / ThreeQuarters | 2 / 4 / 5 / 8 / 12 dp | dimens |
| juicyLength1 / 1AndHalf / 2 / 2AndQuarter / 2AndHalf / 3 / 4 / 4andHalf / 5 / 6 / 6AndHalf / 7 | 16 / 24 / 32 / 36 / 40 / 48 / 64 / 72 / 80 / 96 / 104 / 112 dp | dimens |
| juicyLengthNegativeHalf / Negative1 | −8 / −16 dp | dimens |
| juicyTappableTokenPadding / juicySafeTappableTokenPadding | 12 / 4 dp | dimens |
| activity_horizontal_margin / vertical | 16 / 16 dp | dimens |
| challengeElementContainerPadding | 16 dp (duoSpacing16) | dimens |
| Legacy: small_margin 5, medium_margin 7, generic_margin 10, large_margin 15, huge_margin 20 | dp | dimens |

No dimens are overridden in any `values-*` qualifier folder (checked: none of them redefines a `duoSpacing*` or
`juicy*` dimen).

Component spacing set in styles: buttons pad 16 left/right, min height **52dp**, icon gap 8 (`TransparentButton`);
cards pad 16 all round, min width 48 (`_BaseCard`); inputs pad 16, credential inputs min height 52;
`PointingCard` pads 16; `CardCap` pads 8 top/bottom; `SmallIconCard` 48×48; `NavigationIcon` 32×32 with 4 padding.

---

### 4. Radii, borders and lips

#### 4.1 Dimens

| Token | Value | Source |
|---|---|---|
| **juicyLipHeight** | **4dp** | dimens |
| juicyStrokeWidthHalf / 1 / 2 / Negative1 | 1 / 2 / 3 / −2 dp | dimens |
| roundedCornerRadius | 14dp | dimens |
| dialog_corner_radius | 12dp | dimens |
| section_card_round_corners | 22dp | dimens |
| widget_round_corners | 16dp | dimens |
| pill_shaped_button_radius (legacy `App_ButtonStyle`) | 24dp | dimens |
| profileStatLabelRadius | 6dp | dimens |
| card_corner (legacy `card_white_light`) | 2dp | dimens |
| strokeAnimationWidth | 6dp | dimens |

#### 4.2 Per component (style chain resolved)

`Link` → `TransparentButton` → `SolidButton` / `OutlineButton` → `_BaseCard` → `ClickableCard` / `UnclickableCard`.

| Component | Corner radius | Border | Lip height | Source |
|---|---|---|---|---|
| All Juicy buttons (`TransparentButton` and children) | **16dp** (duoSpacing16) | Solid: 0 (from `Link`). Outline: **2dp** | **4dp** (juicyLipHeight) | styles |
| Clickable / selectable cards | 16dp | 2dp | 4dp | styles `_BaseCard` ← `OutlineButton` |
| UnclickableCard, StatCard, TabRedesignUnclickableCard | 16dp | 2dp | 0 → drawn as 2dp (see below) | styles |
| SelectableBlueCard | 16dp | 0 (2dp when selected) | 4dp | styles |
| PointingCard (tooltips, speech bubbles) | 16dp; arrow 16 wide × 8 high | 2dp | 4dp | styles |
| SpeechBubble | 16dp; arrow 12 wide × 16 high, offset 20, on the start side | 2dp | 4dp | styles |
| HomePathTooltip | 10dp; arrow radius 4dp, pointing down | 2dp | 4dp | styles |
| OutlineInput / CredentialInput | 16dp | 2dp | 2dp | styles |
| CardCap | `capRadius` 16dp | – | – | styles |
| StartTopCardCap shape | top-left and bottom-right 16dp only | – | – | `drawable-ldltr\card_cap_macaw.xml` |
| Progress bar | height / 2 (pill) | – | – | `sources\p000\kcw.java` `getRadius()` |
| Selected tab background | 8dp | 2dp BlueJay | – | `drawable\selected_tab.xml` |
| Path level node | oval 70 × 57dp | – | **8dp** (the oval is drawn twice, the lip copy offset 8dp down) | `drawable\path_level_oval_unpressed.xml` |

`app:cornerRadius` values set directly in layouts, most frequent first: duoSpacing12 (25), duoSpacing8 (11),
duoSpacing16 (9), duoSpacing24 (7), 6dp (7), duoSpacing32 (6), 12dp (6), 10dp (5). `app:borderWidth`: 0dp (37),
2dp (13). `app:lipHeight`: 0dp (6), then one each of 8, 5, 4, 3dp and juicyLipHeight.

#### 4.3 How the lip is drawn (LipView, `hkn.m30623p`)

The view's background is a layer list. In the rest state:

1. A rounded rect in the **lip colour** fills the whole view (radius = cornerRadius).
2. A rounded rect in the **face colour** sits on it, inset by `borderWidth` on the left, top and right and by
   `lipHeight` at the bottom (radius = cornerRadius − borderWidth).

So the lip colour shows as a `borderWidth` ring plus a `lipHeight` band at the bottom. `lipHeight` is read as
`max(lipHeight, borderWidth)` (CardView l.302, JuicyButton l.169), which is why a 0-lip card with a 2dp border
still shows a 2dp bottom edge.

Pressed: the whole shape moves down by `lipHeight − borderWidth` (`hkn.m30625a`), the bottom band shrinks to
`borderWidth`, and the content padding shifts by the same amount (`hkn.m30626b`). Solid button (border 0, lip 4):
drops 4dp, lip gone. Outline button (border 2, lip 4): drops 2dp, bottom edge 4 → 2.

Disabled (JuicyButton styles it by default, `f21975i = true`): one flat rounded rect in `disabledFaceColor`
(default Swan), placed at the pressed position (top inset `lipHeight − borderWidth`), no lip. With `dimWhenDisabled`
the face becomes the lip colour at alpha 26/255 (`fq7.m28565e`). Disabled text defaults to Hare.

Selected (CardView): face → `selectedFaceColor` (default Iguana), lip/border → `selectedLipColor` (default BlueJay),
text → `selectedTextColor` (default Macaw), border width → `selectedBorderWidth`. CardView also strokes the
border path in the lip colour on top of its children (`onDrawForeground`), so content never covers the border.

Grouped lists: `position` (attrs: bottom, bottom_no_top, center_vertical, center_vertical_no_top, none, top,
top_no_bottom, top_full_bottom, left, right) picks which corners are rounded and which border sides are halved, so
stacked cards share one border (`LipView$Position.java`).

#### 4.4 Progress bar

`ProgressBar*` styles: height **16dp**, colour Owl / Macaw (sticky) / Bee / Fox; track Swan (default
`progressBarBackgroundColor`). A **shine** is drawn on the fill: StickySnow at alpha 51 (20%), from 20% to 50% of
the bar's height and corner radius 0.15 × height (both derived from `f21997E = 0.3`), inset 16dp (`shineBarHorizontalMargin`) from each end.
Source: styles; `JuicyProgressBarView.java` l.66–71, l.119–143, l.172.

---

### 5. Elevation and shadows

Duolingo builds depth from **lips**, not shadows. `android:elevation` appears in 21 of 1,603 layouts, mostly for
stacking order: `elevationHomeToolbar` 2dp, `elevationActionBarView` 5dp, `elevationPurchasePageCheckmark` 3dp,
`elevationMatchButtonSparkles` 2dp, `elevationSpeakingRoleplay` 1dp, `elevationAdventuresHeartsContainer` 8dp,
`gem_animation_elevation` 8dp (dimens); 8 views set `outlineProvider="none"`. `App_ActionBarTabBarTheme` has 10dp
elevation (legacy action bar). LipView has an optional "shadow" layer (`getShouldDisplayShadow`), but it is a flat
**Swan** rounded rect behind the view, not a blur (`hkn.m30621h`). The home top bar uses a **2dp bottom border**
rather than a shadow (`toolbarBorder`, `layout_height="2dp"`, `layout\home_content.xml` l.305–308).

---

### 6. Iconography

| Fact | Value | Source |
|---|---|---|
| Vector drawables | 3,028 of 12,075 files in `drawable\` | count |
| Most common icon size | 24dp (163), then 32dp (87), 40dp (73), 25dp, 20dp, 22dp | `<vector android:width>` histogram |
| Style | **Filled, flat colour**, usually with one lighter highlight shape: gem = Macaw body + Iguana facet (`gem.xml`, 32dp); heart = #ff4b4b + white at 30% (`heart.xml`, 25×24); crown = #ffc800 + #ffd900 (`crown.xml`, 46×42). Paths: 64,194 `fillColor` vs 6,304 `strokeColor` | drawable |
| Stroked icons | round caps (3,548 round vs 49 square, 2 butt), round joins (992 vs 20 miter). Lesson quit X: 32dp, Hare, stroke 3, round caps (`close_actionbar.xml`) | drawable |
| Common stroke widths (viewport units) | 1 (1,032), 2 (266), 6, 3, 1.5, 4 | drawable |
| RTL | 321 drawables set `autoMirrored="true"`; `drawable-ldrtl\` has 97 RTL-specific files | drawable, drawable-ldrtl |
| Tab bar | each tab 48 × 48 (two 49 × 49), icon inset 5dp (`juicyLengthThird`); selected tab = Iguana square, 8dp radius, 2dp BlueJay stroke; tab text selected Macaw, unselected Hare | `layout\tab_redesign_reordered_view_tab_icons.xml`, `layout\view_tab_item.xml`, `drawable\selected_tab.xml`, `color\juicy_tab_text_color.xml` |
| Other icon boxes | `tab_icon.xml` 32dp; `NavigationIcon` 32dp with 4 padding (24 glyph); `profileStatIconSize` 28dp | layout, styles, dimens |
| Inactive / disabled icons | Hare (`close.xml`, `arrow_left.xml`, `arrow_right_hare.xml`); locked path icons Hare | drawable, styles |

---

### 7. Not found in the files

- The lesson grading ribbon colours (correct / incorrect banner). They are built in Compose
  (`sources\com\duolingo\session\grading\`) and no colour resource was traced; the face/lip/text triples for answer
  tiles above come from `MatchButtonView` and `ChallengeOptionView`.
- A Compose typography scale or Compose spacing/radius table (obfuscated).
- Any reference to the variable Duolingo Sans files from Java.
- Night values for Whale, Humpback, Narwhal, Bee, Beetle, Betta, Pig, Camel, Duck, Starfish, Dragon, Peacock and
  GrizzlyLite: they are not redefined in colors-night, so they keep their light hex in dark mode.

---

### 8. CSS variables

```css
:root {
  /* brand + semantic, face / lip */
  --duo-owl: #58CC02;        --duo-tree-frog: #58A700;
  --duo-sea-sponge: #D7FFB8; --duo-turtle: #A5ED6E;
  --duo-macaw: #1CB0F6;      --duo-whale: #1899D6;
  --duo-iguana: #DDF4FF;     --duo-blue-jay: #84D8FF;
  --duo-humpback: #2B70C9;   --duo-narwhal: #1453A3;
  --duo-cardinal: #FF4B4B;   --duo-fire-ant: #EA2B2B;
  --duo-walking-fish: #FFDFE0; --duo-flamingo: #FFB2B2; --duo-pig: #F5A4A4;
  --duo-bee: #FFC800;        --duo-fox: #FF9600; --duo-camel: #E7A601;
  --duo-canary: #FFF5D3;     --duo-duck: #FBE56D; --duo-guinea-pig: #CD7900; --duo-cowbird: #AE6802;
  --duo-beetle: #CE82FF;     --duo-betta: #9069CD; --duo-starfish: #FF86D0;
  --duo-dragon: #CC348D;     --duo-peacock: #00CD9C; --duo-grizzly-lite: #DC8F47;

  /* neutrals */
  --duo-snow: #FFFFFD;  --duo-white: #FFFFFF; --duo-polar: #F7F7F7; --duo-swan: #E5E5E5;
  --duo-hare: #AFAFAF;  --duo-dove: #9D9D9D;  --duo-wolf: #777777;  --duo-eel: #4B4B4B;

  /* overlays */
  --duo-black-20: rgba(0,0,0,.2);   /* path-node lip */
  --duo-black-50: rgba(0,0,0,.5);   /* scrim */
  --duo-white-50: rgba(255,255,255,.5); /* lip of a white button on colour */
  --duo-bar-shine: rgba(255,255,253,.2);

  /* roles */
  --duo-bg: var(--duo-snow);
  --duo-surface: var(--duo-polar);
  --duo-border: var(--duo-swan);
  --duo-text: var(--duo-eel);
  --duo-text-2: var(--duo-wolf);
  --duo-text-disabled: var(--duo-hare);
  --duo-link: var(--duo-macaw);

  /* type (px = sp) */
  --duo-font: "Duolingo Sans", "DIN Next for Duolingo", system-ui, sans-serif;
  --duo-fs-page-l: 40px; --duo-lh-page-l: 44px;
  --duo-fs-page-m: 32px; --duo-lh-page-m: 36px;
  --duo-fs-h-l: 28px;    --duo-lh-h-l: 32px;
  --duo-fs-h1: 25px;
  --duo-fs-h-m: 24px;    --duo-lh-h-m: 32px;
  --duo-fs-h-s: 20px;    --duo-lh-h-s: 24px;
  --duo-fs-body: 20px;   --duo-lh-body: 28px;
  --duo-fs-paragraph: 19px;
  --duo-fs-button: 17px; --duo-ls-button: .05em;
  --duo-fs-h-xs: 16px;   --duo-lh-h-xs: 20px;
  --duo-fs-caption: 16px; --duo-lh-caption: 24px;
  --duo-fs-label: 16px;  --duo-ls-label: .04em;
  --duo-fs-tiny: 13px;

  /* spacing */
  --duo-sp-4: 4px; --duo-sp-8: 8px; --duo-sp-12: 12px; --duo-sp-16: 16px; --duo-sp-20: 20px;
  --duo-sp-24: 24px; --duo-sp-32: 32px; --duo-sp-40: 40px; --duo-sp-48: 48px; --duo-sp-64: 64px;

  /* shape */
  --duo-radius: 16px;          /* buttons, cards, inputs, tooltips */
  --duo-radius-tooltip-path: 10px;
  --duo-radius-dialog: 12px;
  --duo-radius-tab: 8px;
  --duo-border-w: 2px;         /* outline buttons, cards, inputs */
  --duo-lip: 4px;              /* buttons and clickable cards */
  --duo-lip-input: 2px;
  --duo-lip-node: 8px;         /* path level node */
  --duo-btn-min-h: 52px;
  --duo-bar-h: 16px;
  --duo-icon: 24px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --duo-snow: #131F22; --duo-polar: #202F36; --duo-swan: #37464F; --duo-hare: #52656D;
    --duo-dove: #758289; --duo-wolf: #DCE6EC; --duo-eel: #F1F7FB;
    --duo-owl: #93D333; --duo-tree-frog: #79B933; --duo-turtle: #5F8428;
    --duo-macaw: #49C0F8; --duo-blue-jay: #3F85A7;
    --duo-cardinal: #EE5555; --duo-fire-ant: #D84848; --duo-flamingo: #945151;
    --duo-fox: #FFAB33; --duo-guinea-pig: #D79433;
    --duo-iguana: #202F36; --duo-sea-sponge: #202F36; --duo-walking-fish: #202F36; --duo-canary: #202F36;
  }
}
```

A button in these tokens: face colour as `background`, lip as `box-shadow: 0 var(--duo-lip) 0 <lip colour>` (or a
bottom border), outline variants add a `--duo-border-w` border in the lip colour; `:active` translates it down by
`lip − border` and removes that much of the lip.

---

# Part II — Components


How each building block is drawn. Every value below was read from a file under
`F:\Claude ( New Start )\Duolingo Study\decompiled\`. Paths are relative to it: `res/` = `resources/res/`,
`src/` = `sources/`. `p000/xxx.java` = an obfuscated class in `src/p000/`.

Conventions: 1dp = 1 CSS px, 1sp = 1 CSS px. Colour names are the app's `juicy*` names; hex is the light-mode value
from `res/values/colors.xml` (dark values are in `res/values-night/colors.xml`, see Part I). "[derived]" marks
a number computed from file values, not written in a file. Light-mode hex used below:

| Name | Hex | Name | Hex | Name | Hex |
|---|---|---|---|---|---|
| Snow | #FFFFFD | Macaw | #1CB0F6 | Cardinal | #FF4B4B |
| Polar | #F7F7F7 | Whale | #1899D6 | FireAnt | #EA2B2B |
| Swan | #E5E5E5 | Iguana | #DDF4FF | Pig | #F5A4A4 |
| Hare | #AFAFAF | BlueJay | #84D8FF | Flamingo | #FFB2B2 |
| Wolf | #777777 | Owl | #58CC02 | WalkingFish | #FFDFE0 |
| Eel | #4B4B4B | TreeFrog | #58A700 | Bee | #FFC800 |
| Humpback | #2B70C9 | Turtle | #A5ED6E | Fox | #FF9600 |
| Beetle | #CE82FF | SeaSponge | #D7FFB8 | Camel | #E7A601 |
| Canary | #FFF5D3 | Duck | #FBE56D | GuineaPig | #CD7900 |
| Black20 | #33000000 | White50 | #80FFFFFF | Snow25 | #40FFFFFD |

---

### 0. The one mechanism behind buttons, cards, tokens and choices: the lip

Every 3D surface (JuicyButton, CardView, challenge cards, tap tokens, text inputs) implements the interface
`p000/hkn.java` and gets its background from `hkn.m30623p` (a `StateListDrawable` of layer lists). Read it once;
all components below are this drawing with different numbers.

Attributes (styleable `p000/pvw.java` `f139526h`): `borderWidth`, `cornerRadius`, `dimWhenDisabled`,
`disabledFaceColor`, `disabledLipColor`, `disabledTextColor`, `faceColor`, `faceDrawable`, `lipColor`, `lipDrawable`,
`lipHeight`, `position`, `selectable`, `selectedBorderWidth`, `selectedFaceColor`, `selectedLipColor`,
`styleBorderDisabledState`, `styleDisabledState`, `transparentFace`.

| State | What is drawn | Source |
|---|---|---|
| Rest | Layer 1: rounded rect, **lip colour**, whole view, radius R. Layer 2: rounded rect, **face colour**, inset `bw` left/top/right and `lh` bottom, radius R − bw. So the lip colour is both the border ring and the bottom band. | `hkn.m30621h` + `m30622n` |
| Lip height | `lh = max(lipHeight, borderWidth)`; the band under the face is `lh` thick, including the border. | `CardView.m7209u` (`f21933n`), `JuicyButton` ctor (`f21981o`) |
| Pressed | Both layers move: lip layer top inset = `lh − bw`; face inset top `lh`, bottom `bw`. Bottom edge stays put, the face drops `lh − bw`, the band shrinks to `bw`. Content padding shifts by the same `lh − bw` (top +½, bottom −½ of it on each side of rest). **Instant** (state swap, no animation). | `hkn.m30623p` (`state_pressed` layer), `hkn.m30625a`, `hkn.m30626b` |
| Disabled (when `styleDisabledState`) | One flat rounded rect in `disabledFaceColor` (default **Swan**), top inset `lh − bw` (i.e. at the pressed position), no face layer, no band. With `dimWhenDisabled`: face = lip colour at alpha 26/255, text = lip colour at alpha 51/255. Otherwise text = `disabledTextColor` (default **Hare**). | `hkn.m30623p` (`-state_enabled`), `JuicyButton.m7226z`, `p000/fq7.m28565e` |
| Selected | face → `selectedFaceColor`, lip/border → `selectedLipColor`, border → `selectedBorderWidth`. CardView defaults: **Iguana / BlueJay / text Macaw** (unselected text Eel). | `CardView` ctor + `setSelected`, `JuicyButton.setSelected` |
| Grouped rows | `position` = top / center_vertical / bottom / left / right / …: picks rounded corners (outer radii multipliers) and halves the border on joining edges (`{1,.5,1,.5}` for center_vertical, `{1,1,1,.5}` top, `{1,.5,1,1}` bottom). | `src/com/duolingo/core/design/juicy/ui/LipView$Position.java` |

CardView also strokes the border path in the lip colour over its children (`CardView.onDrawForeground`), but only
when `clipChildren` is true; the `_BaseCard` style family sets `clipChildren=false`, so styled cards skip it.

#### CSS for the mechanism (use for every 3D component below)

```css
/* --face --lip --bw (border) --lh (lip height incl. border) --r (corner) */
.lip{position:relative;isolation:isolate;border:0;background:none;padding:0 16px;
  display:flex;align-items:center;justify-content:center}
.lip::before,.lip::after{content:"";position:absolute;z-index:-1}
.lip::before{inset:0;border-radius:var(--r);background:var(--lip)}                       /* lip layer  */
.lip::after{inset:var(--bw) var(--bw) var(--lh) var(--bw);
  border-radius:calc(var(--r) - var(--bw));background:var(--face)}                       /* face layer */
.lip>*{transform:translateY(calc((var(--bw) - var(--lh)) / 2))}                          /* content sits on the face */
.lip:active::before{top:calc(var(--lh) - var(--bw))}
.lip:active::after{top:var(--lh);bottom:var(--bw)}
.lip:active>*{transform:translateY(calc((var(--lh) - var(--bw)) / 2))}
.lip:disabled::before{top:calc(var(--lh) - var(--bw));background:var(--disabled-face,#E5E5E5)}
.lip:disabled::after{display:none}
.lip:disabled{color:var(--disabled-text,#AFAFAF)}
.lip:disabled>*{transform:translateY(calc((var(--lh) - var(--bw)) / 2))}
/* no transition: Android swaps the drawable instantly */
```

---

### 1. Buttons

#### 1a. Shared button base

| Property | Value | Source |
|---|---|---|
| Class | `JuicyButton` (a TextView) | `src/com/duolingo/core/design/juicy/ui/JuicyButton.java` |
| Min height | **52** (includes the lip) | `res/values/styles.xml` `TransparentButton` |
| Width | match_parent | `TransparentButton` `layout_width -1` |
| Padding | **16** start/end; icon gap (`drawablePadding`) **8** | `TransparentButton` |
| Corner radius | **16** | `TransparentButton` `cornerRadius duoSpacing16` |
| Lip height | **4** (`juicyLipHeight`) on Solid*/Outline* | `SolidButton`, `OutlineButton`; `res/values/dimens.xml` |
| Text | **17sp, bold, all caps, letterSpacing 0.05**, centred, 1 line, autosize down to 8sp | `_BaseTextStylesForButtonsAndCardCaps`, `Link` |
| Font | bold typeface is swapped to **DuolingoSans Bold** (`res/font/duolingosans_bold.otf`) | `JuicyButton.setTypeface` → `p000/zm50.m52851a` |
| Disabled | styled by default (`styleDisabledState` defaults true in code): flat Swan, text Hare, at pressed position | `JuicyButton` ctor (`f21975i = true`, `f21978l` Swan, `f21966G` Hare) |
| Loading | text hidden, a progress drawable at start tinted `progressIndicatorTint` (Snow on Solid) | `JuicyButton.setShowProgress`, `SolidButton` |
| Icon + text | content block is centred as a whole (icon + gap + text) | `JuicyButton.onDraw` |

#### 1b. Variants (all inherit 1a)

| Style | Face | Lip (and border) | Border | Lip h | Text | Source (`res/values/styles.xml`) |
|---|---|---|---|---|---|---|
| `SolidButton` (default primary, blue) | Macaw | Whale | 0 | 4 | Snow | `SolidButton` |
| `SolidBlueButton` | Macaw | Whale | 0 | 4 | Snow | `SolidBlueButton` |
| `SolidGreenButton` (CHECK / CONTINUE) | Owl | TreeFrog | 0 | 4 | Snow | `SolidGreenButton` |
| `SolidRedButton` (danger, wrong-answer CONTINUE) | Cardinal | FireAnt | 0 | 4 | Snow | `SolidRedButton` |
| `SolidYellowButton` (gold) | Bee | Fox | 0 | 4 | Snow | `SolidYellowButton` |
| `GoldSolidLegendaryButton` | Bee | Camel | 0 | 4 | StickyCowbird #AE6802 | `GoldSolidLegendaryButton` |
| `SpeakSofterFeedbackButton` (soft-incorrect CONTINUE) | Bee | Camel | 0 | 4 | Snow | `SpeakSofterFeedbackButton` |
| `SolidRampUpButton` | Betta #9069CD | #6438A8 | 0 | 4 | StickySnow | `SolidRampUpButton` |
| `SolidWhiteButton` (on colour) | Snow | White50 | 0 | 4 | Macaw | `SolidWhiteButton` |
| `StickyWhiteButtonMacaw` | StickySnow | White50 | 0 | 4 | Macaw; disabled face StickySwan, text StickyHare | `StickyWhiteButtonMacaw` |
| `OutlineButton` (secondary, white) | Snow | Swan | **2** | 4 | Macaw | `OutlineButton` |
| `SelectableOutlineButton` | Snow → selected Iguana | Swan → selected BlueJay | 2 | 4 | Macaw | `SelectableOutlineButton` |
| `CorrectSecondaryButton` | SeaSponge | Turtle | 2 | 4 | StickyTreeFrog | `CorrectSecondaryButton` |
| `IncorrectSecondaryButton` | WalkingFish | Flamingo | 2 | 4 | StickyFireAnt | `IncorrectSecondaryButton` |
| `YellowSecondaryButton` | Canary | Duck | 2 | 4 | GuineaPig | `YellowSecondaryButton` |
| `GoogleButton` / `PhoneSignInButton` | Snow | Swan | 2 | 4 | Eel + 24dp start icon | `GoogleButton`, `PhoneSignInButton` |
| `TransparentButton` (text button) | transparent | transparent | 0 | 0 | Macaw, **Whale while pressed** | `Link`; `res/color/juicy_link_text_blue.xml` |
| `TransparentGreenButton` | transparent | transparent | 0 | 0 | Owl | `TransparentGreenButton` |
| `Link` (inline link) | transparent | transparent | 0 | 0 | Macaw / Whale pressed, wrap width | `Link` |

Note: `OutlineButton`'s "border" is not a stroke; it is the Swan lip layer showing 2dp around the face (section 0).

#### 1c. Icon buttons in the lesson

| Button | Spec | Source |
|---|---|---|
| Quit (X) | 32×32 image, X drawn with stroke 3, Hare, no card | `res/layout/activity_session.xml` `quitButton`; `res/drawable/close_actionbar.xml` |
| Tip / calculator / keyboard / word bank | `OutlineButton`, wrap width, 24dp blue icon as `drawableStart`, margin-end 16, sits left of CHECK in the same row | `res/layout/view_challenge_buttons.xml`; `res/drawable/lightbulb_blue.xml` (24×24) |
| Speaker in a prompt | `SpeakerButton`: SolidButton colours (Macaw / Whale, lip 4, radius 16), **48×48**, padding 12 start/end, margin-end 8; white speaker Lottie inside | `SpeakerButton` style; `res/layout/view_speakable_challenge_prompt.xml` |
| Big speaker (listen challenge) | `SpeakerCardView` (CardView) style `SolidButton`: **99×99, radius 22**; slow one **66×66, radius 18**, margin-start 24, bottoms aligned. Icon = Lottie `res/raw/speaker_normal*` / `speaker_slow*` filling the card | `res/layout/fragment_listen.xml`; `src/com/duolingo/session/challenges/SpeakerCardView.java` |
| Speaker without card (character) | 32×32 `SpeakerView` Lottie | `view_speakable_challenge_prompt.xml` |
| Speaker colours | WHITE Snow, BLUE Macaw, GREEN TreeFrog, OCEAN maxOcean | `src/com/duolingo/core/design/juicy/challenge/SpeakerView.java` `ColorState` |

#### 1d. The lesson button row

`res/layout/view_challenge_buttons.xml`: container `paddingBottom 16`. CHECK = `submitButton`, `SolidGreenButton`,
**`enabled=false` until an answer is chosen** (so it shows the disabled state: flat Swan, Hare text). After grading,
CONTINUE replaces it: `continueButtonGreenStub` (`SolidGreenButton`), `continueButtonRedStub` (`SolidRedButton`),
`continueButtonYellowStub` (`SpeakSofterFeedbackButton`), each with `dimWhenDisabled=true`, margin-top 16.

#### 1e. Compose buttons (newer screens)

`src/com/duolingo/core/design/compose/components/buttons/`: `Variant` = PRIMARY, PRIMARY_INVERTED,
PRIMARY_INVERTED_STICKY, SECONDARY_OUTLINE, SECONDARY_LINK, SECONDARY_LINK_DESTRUCTIVE; `ButtonSize` LARGE / SMALL;
`State` ENABLED / DISABLED / LOADING. Colours are `LipButtonColors(face, content, disabledFace, disabledContent,
pressedContent, lip)` from `p000/qjn.java` (`LipButtonDefaults`), theme getters resolved through `p000/xbc.java` →
`p000/wml.java` / `p000/yml.java`:

| Defaults | face | content | disabled face | disabled content | pressed content | lip |
|---|---|---|---|---|---|---|
| primaryColors | Macaw | Snow | Swan | Hare | Snow | Whale |
| primaryInvertedColors | Snow | Macaw | Swan | Hare | Whale | Swan |
| secondaryColors | Snow | Macaw | Snow | Hare | Whale | Swan |
| transparentColors | transparent | Macaw | transparent | Hare | Whale | transparent |
| SecondaryLinkDestructive (secondaryColors with content and pressed content overridden; passed to the link button) | Snow | FireAnt | Snow | Hare | FireAnt | Swan |

`qjn` constants: `44f`, content padding **12 / 4 / 12 / 4**, shape **rounded 12**; `LipButton` (`p000/bkb.java`)
default lip **4**, icon/text gap 8; SecondaryOutline draws a **2dp** border in the lip colour (`p000/tlf.java`
`m46725M`). Which `ButtonSize` uses the 44 / 12-radius values was not resolved; lesson screens use the XML
JuicyButton (52 tall, radius 16).

#### CSS

```css
.btn{--r:16px;--bw:0px;--lh:4px;min-height:52px;width:100%;
  font:700 17px/1 "DuolingoSans","Baloo Bhaijaan 2",sans-serif;letter-spacing:.05em;text-transform:uppercase}
/* markup: <button class="btn lip btn-green"><span>تحقق</span></button> */
.btn-blue  {--face:#1CB0F6;--lip:#1899D6;color:#FFFFFD}
.btn-green {--face:#58CC02;--lip:#58A700;color:#FFFFFD}
.btn-red   {--face:#FF4B4B;--lip:#EA2B2B;color:#FFFFFD}
.btn-gold  {--face:#FFC800;--lip:#FF9600;color:#FFFFFD}
.btn-white {--face:#FFFFFD;--lip:#E5E5E5;--bw:2px;color:#1CB0F6}
.btn-white.selected{--face:#DDF4FF;--lip:#84D8FF}
.btn-text  {--face:transparent;--lip:transparent;--lh:0px;color:#1CB0F6}
.btn-text:active{color:#1899D6}
.btn.dim:disabled{--disabled-face:color-mix(in srgb,var(--lip) 10%,transparent);
  color:color-mix(in srgb,var(--lip) 20%,transparent)}      /* 26/255 and 51/255 */
.icon-btn{width:auto;padding:0 16px;gap:8px}               /* OutlineButton + 24px icon */
.speaker{--r:22px;width:99px;height:99px;padding:0}         /* slow: 66px, --r:18px */
```

---

### 2. Cards and selectable cards

#### 2a. Card styles (`CardView`, a LinearLayout)

| Style | Chain | Face / lip | Border | Lip h | Radius | Padding | Min | Source |
|---|---|---|---|---|---|---|---|---|
| `ClickableCard` | `_BaseCard` → `OutlineButton` → `TransparentButton` | Snow / Swan | 2 | 4 | 16 | **16** all sides | width 48, height 52 | `res/values/styles.xml` |
| `SelectableCard` | `ClickableCard` + `selectable=true` | rest Snow/Swan, selected **Iguana / BlueJay**, text Eel → **Macaw** | 2 | 4 | 16 | 16 | | same + `CardView` ctor defaults |
| `UnclickableCard` | `_BaseCard`, `lipHeight 0` | Snow / Swan | 2 | 2 (= border, so flat) | 16 | 16 | | `UnclickableCard` |
| `UnclickableNoOutlineCard` | border 0 | Snow | 0 | 0 | 16 | 16 | | same |
| `InputCard` | `UnclickableCard` | Polar / Swan | 2 | 2 | 16 | 0 | | `InputCard` |
| `SolidClickableCard` | `ClickableCard` | Macaw / Whale, text Snow | 0 | 4 | 16 | 16 | | `SolidClickableCard` |
| `StatCard` | `UnclickableCard` | Snow / Swan | 2 | 2 | 16 | 0 | | `StatCard` |
| `PromptCard` | — | Polar / #E3E3E3 | 2 | — | 14 | 0 | | `PromptCard` |

Pressed / disabled / selected follow section 0. A SelectableCard toggles its own selection on click
(`CardView.m7209u`: `selectable` → click listener).

#### 2b. Multiple-choice option (`ChallengeOptionView`)

`res/layout/view_challenge_option.xml`: `ChallengeOptionView` style `ClickableCard`, margin-top 8. Inner text
`optionText`: style `Paragraph` (**19sp, Eel, line spacing ×1.2**), centred. The class extends `p000/iz4.java`
(ChallengeCardView), which fixes its own geometry in code: **border 2** (`juicyStrokeWidth1`), **radius 16**,
**lip 4** (`duoSpacing4`), disabled face Swan (`iz4` ctor l.150-153). Padding 16 from the style (moved onto an inner
FrameLayout).

Colours per state (`p000/gz4.java` lazy fields, mapped by `iz4.setColorState` / `m33400d` and `gz4.m29988a-c`):

| State | Face | Lip + border | Text | Source |
|---|---|---|---|---|
| DEFAULT | Snow | Swan | Eel | `gz4` b / c / d |
| SELECTED | **Iguana** | **BlueJay** | **Macaw** | `gz4` e / f / g |
| GRADED_CORRECT | **SeaSponge** | **Turtle** | **TreeFrog** | `gz4` h / i / j |
| INCORRECT (Compose challenge cards) | **WalkingFish** | **Pig** | **Cardinal** | `gz4` k / l / m, `ChallengeCardColors$State.INCORRECT` |
| DISABLED | Snow | Swan | Eel | `gz4` n / o / d |
| Stories wrong pick | animates WalkingFish→Snow face, Pig→Swan lip, Cardinal→Swan text over `config_longAnimTime` | | | `ChallengeOptionView.m10657j` |
| Stories greyed-out option | disabled, text Swan | | | `ChallengeOptionView.setViewState` |

Correct-answer jump ("atomic delight", `iz4.m33398c`, keyframes `p000/mz4.java` `f122486a`): `translationY` of the
content, in raw pixels as written (no dp conversion in this code): 0→20 (83ms, `cubic-bezier(.01,0,0,1)`), 20→−35
(17ms, linear), −35→−65 (133ms, `(.1,.53,0,.92)`), −65→12 (217ms, `(1,−.05,.95,.65)`), 12→−20 (117ms,
`(.09,.75,.4,.95)`), −20→0 (83ms, `(.89,−.08,.95,.79)`) = 650ms. Other lists in `mz4` drive the lip/shadow offsets and
two sparkles (12×12 top-start and 8×8 bottom-end, `res/layout/view_challenge_card.xml`). The colour switches to
GRADED_CORRECT 100ms after start (`postDelayed(…,100)`).

Maths choices: `MathChallengeCardView` (same `iz4` base, style `MathClickableCard` = `_BaseCard` clickable) — same
colours; it can keep the SELECTED colours when correct (`setShouldKeepSelectedColorWhenCorrect`).
`src/com/duolingo/feature/math/ui/components/MathChallengeCardView.java`.

#### 2c. Word-bank tap tile (`TapTokenView`) and its slots

| Property | Value | Source |
|---|---|---|
| Class / style | `TapTokenView` extends `CardView`, style `ClickableCard`, `styleDisabledState=true` | `res/layout/view_tap_token_juicy.xml` |
| Face / lip / border / lip h / radius | Snow / Swan / 2 / 4 / 16 | `ClickableCard` chain |
| Inner padding | **12** all sides (`juicyTappableTokenPadding`), set by the token factory | `p000/l170.java` `m36343c`; `p000/o5.java` l.97, l.877-881 |
| Margins between tiles | top **4**, bottom **4**, end **8** (start in RTL) | `l170.m36344d` (`f111205c` = duoSpacing8, halves top/bottom) |
| Text | `Paragraph` 19sp Eel, regular weight, centred, min width 4; can autosize 8sp→given size | `res/layout/view_tap_token_text_content.xml`, `TapTokenView.setTokenTextAutoSize` |
| Min size | width 48, height 52 | `_BaseCard`, `TransparentButton` |
| Pressed | drops 2 (lip 4 → 2), instant | section 0 |
| Empty (tile moved to the answer) | text invisible + `setEnabled(false)` → flat **Swan** rect of the same size, top lowered 2 | `TapTokenView.setEmpty`; section 0 disabled |
| Answer line under a blank | 2dp line, **Swan**, **Macaw** when the slot is selected | `res/layout/view_completable_token_placeholder.xml`, `res/drawable/placeholder_line.xml` |
| Inline blank in text | 80 wide, 2dp **Hare** underline 1dp above the bottom, text padding 4 top/bottom | `res/layout/view_token_text_juicy_blank.xml` |
| Match-pairs option | padding 4 (`juicySafeTappableTokenPadding`), maths version 12 | `res/layout/view_match_option.xml`, `view_math_match_option.xml` |

#### CSS

```css
.card{--face:#FFFFFD;--lip:#E5E5E5;--bw:2px;--lh:4px;--r:16px;padding:16px;min-height:52px}  /* + .lip */
.choice{margin-top:8px;font:400 19px/1.2 "DuolingoSans",sans-serif;color:#4B4B4B}
.choice.selected{--face:#DDF4FF;--lip:#84D8FF;color:#1CB0F6}
.choice.correct {--face:#D7FFB8;--lip:#A5ED6E;color:#58A700}
.choice.wrong   {--face:#FFDFE0;--lip:#F5A4A4;color:#FF4B4B}
.tile{padding:12px;margin:4px 0 4px 8px;min-width:48px;min-height:52px;font-size:19px;color:#4B4B4B}  /* RTL: margin-left */
.tile.empty{color:transparent;pointer-events:none}       /* + render as .lip:disabled */
.slot-line{height:2px;background:#E5E5E5}.slot-line.on{background:#1CB0F6}
```

---

### 3. Progress bars

#### 3a. Engine (`JuicyProgressBarView` on `p000/kcw.java`)

| Property | Value | Source |
|---|---|---|
| Track | Swan (`progressBarBackgroundColor` default) | `JuicyProgressBarView.getBackgroundColorRes` |
| Radius | height / 2 (both track and fill), ends can be flat (`useFlatEnd`, `useFlatStart`) | `kcw.getRadius`, `kcw.m35375k` |
| Fill width | `p × (W − 2r − minW) + minW + 2r` (minW = min progress width) | `kcw.m35371g` |
| Fill animation | 400ms, `OvershootInterpolator` (Android default tension 2) | `kcw.m35368e` |
| Shine | colour StickySnow at alpha 51; from y = 0.2h to 0.5h (height 0.3h), radius 0.15h; inset `shineBarMarginHorizontal` from each end of the fill (default **16**); drawn only if wider than 0.3h | `JuicyProgressBarView` ctor, `getShineBarViewBounds`, `mo7227d` |
| Text inside (optional) | DuolingoSans Bold, Hare, 2× stroke variant in bar colour and Snow, clipped to fill | `JuicyProgressBarView` ctor / `onDraw` |
| Heights / colours (styles) | 16dp; Green = Owl, Blue = StickyMacaw, Gold = Bee, Orange = Fox | `ProgressBarGreen/Blue/Gold/Orange` |

#### 3b. Lesson progress bar (top of a lesson)

| Property | Value | Source |
|---|---|---|
| Header row | padding 16; quit X (32×32) then bar | `res/layout/activity_session.xml` `headerContainer` |
| Bar | `LessonProgressBarView`, **16 tall**, weight 1, margin 16 start/end | same, `progress` |
| Fill colour | Owl normally; by streak state: WARM/HOT Bee, BURNING Fox, MATCH_MADNESS Cardinal, RAMP_UP Beetle, combo gradient #00FFFC → #268AFF | `src/com/duolingo/data/session/progressbar/model/ProgressBarStreakColorState.java`; `colors.xml` `comboRunProgressBar*` |
| Colour change | ArgbEvaluator ObjectAnimator (default duration) | `LessonProgressBarAndroidView.m8864m` |
| Min fill | 32 (`duoSpacing16 × 2`) | `LessonProgressBarAndroidView.getMinProgressWidth` |
| Shine inset | **4** (not 16); in one state height 0.25h, offset 2 | `LessonProgressBarAndroidView.m8865n` |
| Fill animation | 400ms overshoot (engine) | `kcw.m35367b` |

#### 3c. Quest / challenge progress bar

`res/layout/view_challenge_progress_bar.xml`: `JuicyProgressBarView` **20 tall**, `ProgressBarGold` (Bee),
`useFlatEnd=true`, margin-start 12; chest/badge icon **46×46** over the right end; label `LabelMedium` (**16sp bold caps,
letterSpacing .04, lineHeight 16**), base colour Hare (`monthlyChallengeProgressLabelBase`), a second copy with
**3dp stroke** clipped to the fill. In the daily-quest card it sits margin-top 8, bottom 24, start 4
(`res/layout/tab_redesign_view_daily_quest_item.xml`).

Segmented variant: `res/layout/view_segmented_lesson_progress_bar.xml` (3 pieces, 16 tall, `ProgressBarGreen`, 12 gap);
`view_segmented_progress_bar_segment.xml` (24-tall bar, 36-wide end icons, a 34-tall pointing card above with corner 5,
arrow 5×5).

#### CSS

```css
.bar{height:16px;border-radius:8px;background:#E5E5E5;position:relative}
.bar>.fill{position:absolute;inset:0 auto 0 0;border-radius:inherit;background:var(--bar-c,#58CC02);
  min-width:48px;                                  /* lesson: 32 + 2r */
  transition:width .4s cubic-bezier(.34,1.56,.64,1)} /* ≈ Android Overshoot(2) [derived approx] */
.bar>.fill::after{content:"";position:absolute;left:4px;right:4px;   /* 16px on generic bars */
  top:20%;height:30%;border-radius:999px;background:rgba(255,255,253,.2)}
[dir=rtl] .bar>.fill{inset:0 0 0 auto}
.quest-bar{height:20px;--bar-c:#FFC800}
```

---

### 4. Tooltips and speech bubbles (`PointingCardView`)

Drawn as one path: rounded rect + arrow, filled with the face colour, stroked with the lip colour (round joins and
caps) at `borderWidth`. **No lip / no 3D.** Arrow may have a rounded tip (`arrowRadius`). Padding grows by the arrow
height on the arrow side. Arrow direction START/END is mirrored in RTL.
`src/com/duolingo/core/design/juicy/ui/PointingCardView.java`, `C2073a.java` (`onBoundsChange`, `draw`).

| Style | Face | Stroke | Border | Radius | Arrow (w×h, side, offset, tip r) | Padding | Source |
|---|---|---|---|---|---|---|---|
| `PointingCard` (base) | Polar | Swan | 2 | 16 | 16×8, top, centred, 0 | 16 | styles.xml |
| `HomePathTooltip` (START over the node) | Snow (set in code) | Swan | 2 | **10** | 16×8, **bottom**, tip **4** | 0 (set by layout) | styles.xml; see `Duolingo Study/notes/duolingo-home-path-spec.md` §3 |
| `SpeechBubble` (character talks, lesson) | Snow | Swan | 2 | 16 | **12 wide × 16 long, start side, 20 from top** | 16 | `SpeechBubble` |
| `SpeechBubbleAbove` | Snow | Swan | 2 | 16 | 12×16, bottom, offset 20 | 16 | `SpeechBubbleAbove` |
| `DialogueBubbleA` / `B` (two speakers) | Polar / Iguana | Swan / #84D8FF | 2 | 16 | 12×16, start / end, offset 20 | 16 | styles.xml |
| Segment pointer | | | | 5 | 5×5 bottom | 0, text H3 with 12 side margin | `view_segmented_progress_bar_segment.xml` |

Shine option: a diagonal-stripe bitmap `res/drawable/d5_speech_bubble_shine.xml` swept along the stroke
(`C2073a.draw`, `f22119p`).

#### CSS

```css
.bubble{position:relative;background:#FFFFFD;border:2px solid #E5E5E5;border-radius:16px;padding:16px}
/* 16×8 bottom arrow = a 45° triangle: a square of 16/√2 ≈ 11.3px rotated */
.bubble.down::after{content:"";position:absolute;left:50%;bottom:-7.7px;width:11.3px;height:11.3px;
  background:inherit;border:inherit;border-width:0 2px 2px 0;border-radius:0 0 4px 0;
  transform:translateX(-50%) rotate(45deg)}
/* 12×16 side arrow (SpeechBubble) is not 45°: draw it as an inline SVG path
   M0,0 L16,6 L0,12 with fill #FFFFFD, stroke #E5E5E5 2px, stroke-linejoin round, overlapping the card edge 2px */
```

---

### 5. Lesson feedback sheet (grading ribbon)

The ribbon is Jetpack Compose (`GradingRibbon.kt`, `LegacyInteropGradingRibbon.kt`, decompiled into `p000/zyc.java`,
`p000/e2n.java`). Colours come from `GradingRibbonDefaults` (`p000/iyi.java`) as
`GradingRibbonColors(backgroundColor, contentColor, secondaryOutlineButtonColors, …)` (`p000/hyi.java` `toString`),
theme getters resolved via `p000/xbc.java` → `p000/wml.java`:

| Kind | Background | Content (title, icon tint) | Secondary outline button face / content / lip | CONTINUE button |
|---|---|---|---|---|
| Correct | **SeaSponge #D7FFB8** | **TreeFrog #58A700** | SeaSponge / Owl / Turtle (disabled content Turtle) | `SolidGreenButton` |
| Incorrect | **WalkingFish #FFDFE0** | **FireAnt #EA2B2B** | WalkingFish / Cardinal / Flamingo (disabled content Flamingo) | `SolidRedButton` |
| Soft incorrect ("almost") | **Canary #FFF5D3** | **GuineaPig #CD7900** | Canary / Bee / Duck (disabled content Duck) | `SpeakSofterFeedbackButton` (Bee / Camel) |

| Part | Value | Source |
|---|---|---|
| Status icon | 26×26 circle: correct TreeFrog with Snow check; incorrect FireAnt with Snow X | `res/drawable/grading_check.xml`, `grading_x.xml` |
| Icon–title row | horizontal, spaced 8 | `e2n.java` (`ey1(8.0f)`) |
| Ribbon column | items spaced 16; a 16 spacer before one explanation block and 8 before the other | `zyc.java` l.1128, l.1203-1229 |
| Shine | `res/drawable/grading_ribbon_shine.xml`: 167×194, white with two diagonal stripes at 50% | |
| Button | 16 above, row padding-bottom 16 | `view_challenge_buttons.xml` |
| XML equivalents | `CorrectSecondaryButton` (SeaSponge / Turtle / text StickyTreeFrog), `IncorrectSecondaryButton` (WalkingFish / Flamingo / StickyFireAnt) | styles.xml |

Not resolved: ribbon height, outer padding, corner radius (if any), title text size/weight, slide-in timing.

#### CSS

```css
.ribbon{position:fixed;inset:auto 0 0 0;padding:16px 16px 16px;display:flex;flex-direction:column;gap:16px}
.ribbon.ok  {background:#D7FFB8;color:#58A700}
.ribbon.bad {background:#FFDFE0;color:#EA2B2B}
.ribbon.soft{background:#FFF5D3;color:#CD7900}
.ribbon .head{display:flex;align-items:center;gap:8px}.ribbon .head img{width:26px;height:26px}
/* padding / title size are placeholders: not found in the files */
```

---

### 6. Bottom sheets

| Part | Value | Source |
|---|---|---|
| Surface | Snow, **top corners 16**, square bottom | `res/drawable/bottom_sheet_rounded_corners.xml`; `ComponentBottomSheetRoundedCornerStyle` |
| Scrim | black, dim amount **0.4** | `ComponentBottomSheetBaseDialogTheme` |
| Peek | 900 (opens fully) | `AppModalStyle` `behavior_peekHeight` |
| Grabber | **37×6** pill, Hare, radius 2.5; margin top 6, bottom 14 | `res/drawable/bottom_sheet_grabber.xml`; `res/layout/bottom_sheet_logout.xml` |
| Typical content | title `H1` (**25sp bold**, ×1.2 line) centred, margin 32 top / 16; body `Paragraph` 19sp Eel, margin 16; primary `SolidButton`, margin 16 top / 16 sides; secondary `TransparentButton`, margin 16 | `bottom_sheet_logout.xml` |
| Full-screen dialog | Snow window, slides in/out from bottom (`slide_in_bottom` / `slide_out_bottom`), no dim | `FullScreenDialog` |

```css
.sheet{background:#FFFFFD;border-radius:16px 16px 0 0;padding:6px 16px 16px}
.sheet::before{content:"";display:block;width:37px;height:6px;border-radius:3px;background:#AFAFAF;margin:0 auto 14px}
.scrim{background:rgba(0,0,0,.4)}
.sheet h2{font:700 25px/1.2 "DuolingoSans";text-align:center;margin:32px 0 16px}
```

---

### 7. Tab bar (bottom)

| Part | Value | Source |
|---|---|---|
| Container | **86 tall**, Snow background | `res/layout/home_content.xml` `tabs`, `tabsBackground` |
| Top border | **2dp Swan** line across the top | `res/layout/tab_redesign_reordered_view_tab_icons.xml` `tabBarBorder` |
| Tab | **48×48** square, spread evenly (chain `spread`), vertically centred under the border | same |
| Icon | fills the square minus **5** each side (38×38), full-colour drawable (not tinted) | `res/layout/view_tab_item.xml` (`juicyLengthThird`) |
| Selected | square background: **radius 8, Iguana fill, 2dp BlueJay stroke** | `res/drawable/selected_tab.xml` |
| Badge dot | 10×10 at icon bottom-end (margin 3 bottom, 2 end); custom 18×18 | `view_tab_item.xml` |

```css
.tabbar{height:86px;background:#FFFFFD;border-top:2px solid #E5E5E5;display:flex;justify-content:space-evenly;align-items:center}
.tab{width:48px;height:48px;padding:5px;border-radius:8px;border:2px solid transparent}
.tab.on{background:#DDF4FF;border-color:#84D8FF}
```

---

### 8. Top stat bar (home)

| Part | Value | Source |
|---|---|---|
| Bar | **48 tall**, margin 16 left/right | `home_content.xml` `toolbar` |
| Bottom border | a 2dp view under the bar (`toolbarBorder`, shown only in some states; colour set in code, not found) | `home_content.xml` |
| Item | a `TransparentButton` (text button), padding-start 16 / end 0 | `res/layout/view_currency_toolbar_item.xml` |
| Icon | **24 tall** inside a 42-tall wrapper, margin 8 each side | `res/layout/view_streak_toolbar_item.xml` |
| Number | `ToolbarItemText`: **17sp bold caps, letterSpacing .05** | styles.xml |
| Selected item | a 25×25 up-triangle under the item (drawer open) | `view_currency_toolbar_item.xml` `selectionIndicator` |
| Alert dot | 9×9, margin-bottom 12 | same |

Per-item number colours are set at runtime (not in XML); see `Duolingo Study/notes/duolingo-home-path-spec.md` §5 for what was traced.

---

### 9. Badges, pills, caps

| Component | Spec | Source |
|---|---|---|
| Option badge ("RECOMMENDED" on a choice card) | plain `CardView` (no border, no lip), **radius 8, Macaw face**, padding **8 × 4**; text `BadgeText` = **15sp bold caps, letterSpacing .04**, Snow; placed on the card's top-end corner, translated **+24 x, −24 y** | `res/layout/view_welcome_fork_option.xml` |
| The card it sits on | `SelectableCard`, min height 112, 65×65 image with 16 margins, header H2 padding 8, subheader `Caption2` (17sp, Wolf) | same |
| Card cap (header strip on a card) | `CardCap`: **15sp bold caps**, Snow on **Humpback #2B70C9**, padding 8 top/bottom, `capRadius` 16; `StartTopCardCap` = one-line, wrap width, padding 12 sides | styles.xml (`card_cap_macaw` drawable not found as a file) |
| Exercise labels | HARD_EXERCISE, PREVIOUS_MISTAKE, NEW_WORD, COMBO (icon + string) | `src/com/duolingo/core/design/compose/components/labels/ExerciseLabelType.java` |
| Path "UP NEXT" etc. | see `Duolingo Study/notes/duolingo-home-path-spec.md` §4 | |

```css
.badge{display:inline-block;background:#1CB0F6;color:#FFFFFD;border-radius:8px;padding:4px 8px;
  font:700 15px/1 "DuolingoSans";letter-spacing:.04em;text-transform:uppercase;
  position:absolute;top:0;inset-inline-end:0;transform:translate(24px,-24px)}  /* RTL: translate(-24px,-24px) */
```

---

### 10. Text inputs

| Property | Value | Source |
|---|---|---|
| Class | `JuicyTextInput` (EditText implementing the lip, section 0) | `src/com/duolingo/core/design/juicy/ui/JuicyTextInput.java` |
| `OutlineInput` | face **Polar**, lip/border **Swan**, border **2**, lip **2** (= border, so no 3D band), radius **16** | styles.xml |
| `Input` | `Paragraph` text (19sp Eel), hint **Hare**, padding 16 | styles.xml |
| `CredentialInput` | min height **52**, padding 16 sides / 0 top-bottom, single line, centred vertically | styles.xml |
| Disabled | not focusable; flat disabled face only if `styleDisabledState` is set | `JuicyTextInput.setEnabled` |
| Focus colour | none in `JuicyTextInput.java` (not found) | |

```css
.input{background:#F7F7F7;border:2px solid #E5E5E5;border-radius:16px;min-height:52px;padding:0 16px;
  font:400 19px/1.2 "DuolingoSans";color:#4B4B4B}
.input::placeholder{color:#AFAFAF}
```

---

### 11. Checkbox and switch

| Component | Spec | Source |
|---|---|---|
| Checkbox box | 32×32 vector. Unchecked: Snow fill, **2 Swan stroke**, rounded square 28×28 radius 7 (outer 30, r 8). Checked: **Macaw** fill 30×30 radius 8, Snow check stroke **3**, round caps/joins (path M8.1,16.4 L13.2,21.6 L23.5,11.9). Disabled unchecked: Polar fill, Swan stroke. Disabled checked: Swan fill, Polar check | `res/drawable/checkbox.xml`, `checkbox_enabled_*.xml`, `checkbox_disabled_*.xml` |
| Checkbox label | **19sp bold**, line spacing ×1.2, DuolingoSans | `src/com/duolingo/core/design/juicy/components/inputs/Checkbox.java` |
| Switch thumb | itself a mini lip card: 30×32, radius 8, outer colour **Macaw (on) / Swan (off)**, inner Snow inset 2/2/2 and **4 at the bottom**, radius 6 | `res/drawable/juicy_switch_thumb.xml`, `res/color/juicy_switch_color.xml` |
| Switch track | pill radius 16, intrinsic 24×18 plus 4 inset top and bottom, tinted Macaw (on) / Swan (off) | `res/drawable/juicy_switch_track.xml`, `JuicySwitch` style |
| Switch overall | track ≈ 60×24 visible, thumb 30×32 [derived from SwitchCompat sizing rules, not in a file] | |

```css
.check{width:30px;height:30px;border-radius:8px;border:2px solid #E5E5E5;background:#FFFFFD}
.check:checked{background:#1CB0F6 url(check-white-3px.svg) center/24px no-repeat;border-color:#1CB0F6}
.switch{width:60px;height:24px;border-radius:16px;background:#E5E5E5;position:relative}
.switch.on{background:#1CB0F6}
.switch>i{position:absolute;top:-4px;inset-inline-start:0;width:30px;height:32px;border-radius:8px;
  background:inherit;box-shadow:inset 0 0 0 2px currentColor}   /* simpler: use .lip with --bw:2px --lh:4px --r:8px --face:#FFFFFD --lip:(on? #1CB0F6 : #E5E5E5) */
.switch.on>i{inset-inline-start:30px}
```

---

### 12. Dialogs

Duolingo has no single juicy alert-dialog component in the XML. Confirmations are bottom sheets (section 6) or
full-screen dialogs (`FullScreenDialog`: Snow, slide from bottom). Debug dialogs show the in-house pattern:
Snow, padding 16, title `H1`, then `OutlineInput`, `SolidButton`, `OutlineButton`, `TransparentButton`, each full
width with 16 above (`res/layout/dialog_path_lesson_override.xml`). Compose dialogs (`EdgeToEdgeFloatingDialogTheme`)
are transparent windows with no elevation; their content was not traced.

---

### 13. The path node (home)

Most of this was traced in `Duolingo Study/notes/duolingo-home-path-spec.md` §1; the values below were re-checked against the files.

| Property | Value | Source |
|---|---|---|
| Box | **70 × 65** | `res/values/dimens.xml` `levelOvalWidth/Height`; `res/layout/view_path_level_oval.xml` |
| Face | ellipse **70 × 57** at the top | `res/drawable/path_level_oval_face_solid.xml` |
| Lip | **8**: the same ellipse 8 lower plus an 8-tall 70-wide band joining them; the lip layers are the face colour with **Black20** (`lipColor`) drawn over it = face darkened 20% | `res/drawable/path_level_oval_unpressed.xml`; `LevelOval` style (`lipColor juicyBlack20`); `app:lipHeight="8dp"` |
| Pressed | only the face, drawn 8 lower; lip gone; instant | `res/drawable/path_level_oval_pressed.xml` |
| Colours | active / passed = unit colour (e.g. `LevelOval.Duo` face `unitThemeDuo` = StickyOwl #58CC02); locked face **Swan**, icon **Hare**; legendary face `unitThemeLegendary`, icon #CD7900; passed and legendary add a two-stripe shine face (`path_level_oval_face_with_shine`) | styles.xml `LevelOval.*` |
| Icon | white (`pathIconColor` StickySnow; locked Hare), centred, `scaleType center` (drawn at its own size; star ≈ 29×29 from the Rive file per the path spec) | `view_path_level_oval.xml`; `LevelOval` |
| Ring (current node) | **98 × 93**, stroke = 0.0816 × 98 ≈ **8** [derived], round cap, starts at **270°** (top), track **Swan**, fill **Bee** (legacy XML), cap Snow | `view_path_level_oval.xml` `progressRing`; `src/com/duolingo/core/design/juicy/ui/FillingRingView.java` l.69-89 |
| Stars row | 70 × 25 under the node | `view_path_level_oval.xml` `path_stars` |
| Tooltip | `PathTooltipView` above the node (see section 4, `HomePathTooltip`) | same |

Note: the Rive node (`res/raw/node_and_ring_*.riv`) stores explicit lip hexes (e.g. Duo #46A302) and a locked lip of
#AFAFAF, while the legacy XML yields Swan × 0.8 = #B7B7B7 for locked [derived]. The path spec documents the Rive set.

```css
.node{position:relative;width:70px;height:65px;border:0;background:none}
.node::before{content:"";position:absolute;left:0;top:8px;width:70px;height:57px;border-radius:50%;
  background:color-mix(in srgb,var(--face) 80%,#000)}                 /* lip ellipse */
.node::after{content:"";position:absolute;left:0;top:0;width:70px;height:57px;border-radius:50%;
  background:var(--face);box-shadow:0 4px 0 0 color-mix(in srgb,var(--face) 80%,#000)}  /* face + band */
.node>svg{position:absolute;left:50%;top:28.5px;transform:translate(-50%,-50%);z-index:1}
.node:active::before{display:none}
.node:active::after{top:8px;box-shadow:none}
.node:active>svg{top:36.5px}
.node.locked{--face:#E5E5E5}.node.locked>svg{color:#AFAFAF}
.ring{width:98px;height:93px}  /* SVG ellipse rx 45 ry 42.5, stroke 8, track #E5E5E5, arc from the top, round cap */
```

---

### 14. Not found / not resolved

- Grading ribbon geometry: height, padding, corner radius, title font size and weight, entrance animation
  (Compose, obfuscated; only colours and the 8 / 16 spacings were resolved).
- Which Compose `ButtonSize` uses the `qjn` constants (44, padding 12/4, radius 12).
- A focused-state colour for text inputs.
- `card_cap_macaw` drawable (referenced by `StartTopCardCap`) as a file.
- Top stat bar number colours and the toolbar border colour (set at runtime).
- Switch overall track size (only the drawables' intrinsic sizes are in files).
- The meaning of the first number in `ProgressBarStreakColorState` (0 / 3 / 4 / 5); presumably an in-a-row count,
  not verified.
- Whether `mz4` jump values are scaled to dp anywhere else (in `iz4` they are applied as raw pixels).

---

# Part III — Motion, sound, haptics and screen patterns


Source: `F:\Claude ( New Start )\Duolingo Study\decompiled\` (jadx). In the tables, `res/` means `decompiled/resources/res/`
and `src/` means `decompiled/sources/`. Obfuscated classes are `src/p000/<name>.java`.

Units: dp = CSS px, ms. Rive and Lottie files run at 60 fps unless noted (frame N = N × 16.7 ms).

Tags:
- **[file]**: read straight from the file named in the row.
- **[platform]**: an Android or Jetpack Compose framework default. These values are not in the APK, but every Android phone uses them (`config_shortAnimTime` 200, `config_mediumAnimTime` 400, `config_longAnimTime` 500, a view `Animation` with no interpolator = AccelerateDecelerate, Compose `tween()` with no easing = FastOutSlowInEasing).
- **[approx]**: a CSS stand-in for an Android curve that CSS cannot express exactly.

Earlier notes already measure several sequences frame by frame. This file summarises them and links to them, and does not repeat them:
- `Duolingo Study/notes/duolingo-lesson-complete-spec.md`: the lesson-complete screen (Rive hero, stat cards, streak, daily quests).
- `Duolingo Study/notes/duolingo-leaderboard-climb-spec.md`: the league climb on the session-end screen.
- `Duolingo Study/notes/duolingo-home-path-spec.md`: the path node, ring, tooltip, popover, top bar and tab bar.
- `Duolingo Study/notes/duolingo-onboarding-study.md`: the first-run flow (bubble, typewriter, layouts, stingers).
- Part I (tokens): colours, type, spacing and how the lip is drawn. This file only covers how the lip *moves*.

I re-checked the facts reused below in the sources they cite: `e650`/`StreakIncreasedHeaderRedesignView` PathInterpolator(0.74,0,0.11,0.96); the `vma` daily-quest curves; `ShortLessonStatCardView` 175/300/600/900 ms; `xom` AnticipateOvershoot and Overshoot; `kcw` 400 ms Overshoot after a 200 ms delay; `cg9`, `xbs` and `vqt` path sounds.

---

### 1. Motion

#### 1.1 Easing tokens

| Token | Definition | Where Duolingo uses it | Source | CSS |
|---|---|---|---|---|
| fast-out-slow-in | cubic (0.4, 0, 0.2, 1) | challenge slides (default), onboarding bubble pop, leaderboard glow up | `res/interpolator/fast_out_slow_in.xml`, `mtrl_fast_out_slow_in.xml` | `cubic-bezier(.4,0,.2,1)` |
| fast-out-linear-in | cubic (0.4, 0, 1, 1) | Material bottom sheet out, leaderboard glow out | `res/interpolator/mtrl_fast_out_linear_in.xml` | `cubic-bezier(.4,0,1,1)` |
| linear-out-slow-in | cubic (0, 0, 0.2, 1) | Material bottom sheet in | `res/interpolator/mtrl_linear_out_slow_in.xml` | `cubic-bezier(0,0,.2,1)` |
| snappy ease-out | cubic (0, 0, 0.58, 1) | the "snappier" challenge slides (experiment) | `res/interpolator/snappy_transition_ease_out.xml` | `cubic-bezier(0,0,.58,1)` |
| fast-out-extra-slow-in | path `M0,0 C.05,0 .133333,.06 .166666,.4 C.208333,.82 .25,1 1,1` | fragment open (scale 0.85 → 1) | `res/anim/fragment_fast_out_extra_slow_in.xml` | `linear(0 0%, .013 4%, .056 8%, .146 12%, .273 15%, .433 17%, .586 19%, .674 21%, .754 24%, .84 30%, .912 40%, .951 50%, .987 70%, 1 100%)` (sampled from the path) |
| Overshoot (tension 2) | `t−=1; t²·(3t+2)+1`, peak 1.132 at t≈0.56 | lesson progress-bar fill, its label pop, leaderboard rows, shop "item get" | `src/p000/kcw.java:166`, `src/com/duolingo/data/session/progressbar/LessonProgressBarAndroidView.java:234`, `src/p000/xom.java`, `src/com/duolingo/shop/ItemGetView.java:130` | `linear(0, .233, .433, .603, .744, .859, .951, 1.021, 1.072, 1.106, 1.125, 1.132, 1.128, 1.116, 1.099, 1.078, 1.056, 1.035, 1.017, 1.005, 1)` |
| AnticipateOvershoot (tension 3) | dips to −0.125, overshoots to 1.125 | leaderboard lift (−8 dp), extended match | `src/p000/xom.java:511`, `src/com/duolingo/session/challenges/match/ExtendedMatchFragment.java:286` | `linear(0, -.009, -.032, -.062, -.093, -.116, -.125, -.113, -.074, 0, .116, .28, .5, .72, .884, 1, 1.074, 1.113, 1.125, 1.116, 1.093, 1.062, 1.032, 1.009, 1)` |
| Anticipate (tension 2) | dips to −0.132, then accelerates | `f7i` / `n7i` | `src/p000/f7i.java:129` | `linear(0, -.007, -.025, -.051, -.078, -.104, -.123, -.132, -.125, -.099, -.049, .03, .141, .289, .479, .714, 1)` |
| AccelerateDecelerate | `cos((t+1)π)/2 + 0.5` | **the default for every XML view `<translate>`/`<alpha>` with no interpolator** [platform]: onboarding slides, slide_in_*, tooltip bounce, leaderboard move | platform | `cubic-bezier(.37,0,.63,1)` [approx; this is ease-in-out-sine, the same function] |
| Accelerate | t² | leaderboard drop + crossfade | `Duolingo Study/notes/duolingo-leaderboard-climb-spec.md` §3b | `cubic-bezier(.11,0,.5,0)` [approx] |
| Decelerate | 1−(1−t)² | `abc_slide_in_bottom` | `res/anim/abc_slide_in_bottom.xml` | `cubic-bezier(.5,1,.89,1)` [approx] |
| Streak slide-up | cubic (0.74, 0, 0.11, 0.96) | streak screen, everything moving up together | `src/com/duolingo/streak/StreakIncreasedHeaderRedesignView.java:89`, `src/p000/e650.java:26` | `cubic-bezier(.74,0,.11,.96)` |
| Path "start lesson" zoom | cubic (1, 0, 0.85, 1) | the popover grows to fill the screen | `src/p000/vqt.java` (~l.141, 154) | `cubic-bezier(1,0,.85,1)` |
| Quest bar fill | cubic (0.74, 0.17, 0.69, 0.77) | daily-quest bar | `src/com/duolingo/goals/tab/ChallengeProgressBarView.java:85` | `cubic-bezier(.74,.17,.69,.77)` |
| Quest card flash | (0.17,0.17,0,1) / (0.17,0.17,0.67,1) / (1,0,0.44,1) | daily-quest card highlight | `src/p000/vma.java:50-65`, `src/com/duolingo/goals/dailyquests/DailyMonthlyItemView.java:57-102` | same cubics |

The Rive curves inside the celebration files (title (0.06,0.19,0,1), card pop, ring breathing (.8,0,.85,1)/(.15,0,.2,1) and others) are listed in the three spec notes.

#### 1.2 Standard durations

| Value | Name | Source |
|---|---|---|
| 200 | `config_shortAnimTime`: popup fades, popup scale, slide_in/out_bottom, adventures slides, shop slides | [platform]; referenced by `res/anim/popup_in.xml`, `slide_in_bottom.xml`, … |
| 400 | `config_mediumAnimTime`: fade_in / fade_out (alpha 0.5 ↔ 1), fade_zoom_in, popup_slide_in, slide_in/out_left/right/start/end, `slide_*_medium` | [platform]; `res/anim/*.xml` |
| 500 | `config_longAnimTime`: challenge slides (default), `stay`, duo radio | [platform]; `res/anim/challenge_slide_*.xml` |
| 300 / 360 | snappy challenge slides | `res/anim/challenge_slide_*_snappy_300/360.xml` |
| 250 / 200 | Material bottom sheet in / out | `res/anim/mtrl_bottom_sheet_slide_in.xml` / `_out.xml` |
| 150 | `bottom_sheet_slide_duration`, `config_tooltipAnimTime`, `abc_config_activityShortDur` | `res/values/integers.xml` |
| 220 | `abc_config_activityDefaultDur`; also the grading ribbon in one mode (§1.5) | `res/values/integers.xml`; `src/p000/zyc.java:724` |
| 100 | `mtrl_btn_anim_duration_ms`; `interstitial_fade_out` (linear) | `res/values/integers.xml`; `res/anim/interstitial_fade_out.xml` |
| 400 + 200 delay | lesson progress-bar fill | `src/p000/kcw.java:176-202` |
| 1000 | `rotate_forever` (linear, infinite); path tooltip bounce half-cycle | `res/anim/rotate_forever.xml`; home-path note §3 |

Rule of thumb from these values: small UI state changes run 100-200 ms, panels and screens 250-500 ms, and celebrations come from Rive or Lottie files (1-3 s).

#### 1.3 Button press: the drop onto the lip

- **Mechanism.** Every 3D surface is a `CardView` or a `JuicyButton` (both implement `hkn`). Pressing does not run an animator: `setPressed` → `hkn.m30626b()` shifts the content padding from −(lip−border)/2 to +(lip−border)/2. The content therefore drops by **lip − border**, instantly, and comes back up instantly on release. Source: `src/p000/hkn.java:151-169`, `src/com/duolingo/core/design/juicy/ui/CardView.java:795`, `JuicyButton.java:462`.
- **Outline.** The face outline moves down by the same amount, and the bottom inset shrinks from the lip to the border width (`CardView.getBorderPath`, l.230-247):
  - Solid buttons (border 0, lip 4) drop **4 dp** and lose the lip completely.
  - Outline buttons and cards (border 2, lip 4) drop **2 dp**, and their lip shrinks to 2 dp, the same as the border.
- **Disabled.** When `shouldStyleDisabledState` is on, a disabled button is drawn in the pressed (flat) position (`hkn` l.162). Its default disabled face is `juicySwan` #E5E5E5 (`JuicyButton.java:146`).
- **Haptic.** On press-down, `afj.m833g()` calls `performHapticFeedback(3)` = `KEYBOARD_TAP` when universal haptics are on (`src/p000/afj.java:13`).
- **Path node.** The node is the only element with a settle after release. It is Rive (`node_and_ring_119.riv`): the face drops +8.12 in one frame, then on release goes −0.33 (17 ms), +0.16 (67 ms), 0 (133 ms). See home-path note §1d.
- **Small press-scale.** Only `video_call_repeat_button_press` scales, to 0.75, with duration 0 (`res/animator/video_call_repeat_button_press.xml`).

```css
.btn{position:relative;border-radius:16px;min-height:52px;padding:0 16px;
     background:var(--face);box-shadow:0 4px 0 var(--lip);transform:translateY(0)}
.btn:active{transform:translateY(4px);box-shadow:0 0 0 var(--lip)}          /* solid: drop = lip */
.card{border:2px solid var(--swan);border-bottom-width:4px;border-radius:16px}
.card:active{transform:translateY(2px);border-bottom-width:2px}            /* outline: drop = lip - border */
/* no transition: Duolingo swaps the state in one frame */
```

#### 1.4 Screens, cards and panels entering and leaving

| Moment | Motion | Source |
|---|---|---|
| Next challenge (LTR) | new challenge: translateX +100% → 0 with alpha 0 → 1; old challenge: 0 → −100% with alpha 1 → 0. Both 500 ms, fast-out-slow-in | `src/com/duolingo/session/SessionActivity.java:877-922` (`m10488R`), `res/anim/challenge_slide_in_right.xml`, `challenge_slide_out_left.xml` |
| Next challenge (**RTL**) | mirrored: in from −100% (left), out to +100% (right) (`ubr.m47696m(resources)` = isRtl) | same, branch at l.890 |
| Snappier variant | same moves, 300 ms or 360 ms, cubic (0,0,.58,1). Picked by experiment `SnappierExercisesTransitionCondition` | same |
| Performance mode | no challenge transition at all (`mgu.m38211b()` returns early) | same, l.884 |
| Mid-lesson Duo (coach) | the outgoing challenge slides out (challenge_slide_out_*); the coach screen holds with `stay` (500 ms, no move) | `SessionActivity.java:3640-3675` |
| Splash → first lesson | `fade_zoom_in`: scale 0.7 → 1 about the centre + alpha 0 → 1, 400 ms; the old screen `fade_out` (alpha 1 → 0.5, 400 ms) | `src/com/duolingo/onboarding/BasicsPlacementSplashViewModel.java:3677`, `res/anim/fade_zoom_in.xml` |
| Fragment open | alpha held at 0 for 50 ms, then 0 → 1 in 50 ms (linear); scale 0.85 → 1, 300 ms, fast-out-extra-slow-in | `res/animator/fragment_open_enter.xml` |
| Onboarding step | slide_in_end / slide_out_start, 400 ms, AccelerateDecelerate [platform]. **RTL folders swap the direction** (`res/anim-ldrtl/`) | `res/anim-ldltr/*.xml`, `res/anim-ldrtl/*.xml`; onboarding note §3 |
| Popup / modal | `popup_in` / `popup_out`: alpha, 200 ms. `popup_slide_in`: alpha + translateY 5% → 0, 400 ms, accelerate-decelerate. `popup_scale_in`: scale 0 → 1, 200 ms, pivotX 50% | `res/anim/popup_*.xml` |
| Bottom sheet | in: translateY 20% → 0 + alpha 0 → 1, 250 ms, linear-out-slow-in. Out: 200 ms, fast-out-linear-in. Scrim dim 0.4 | `res/anim/mtrl_bottom_sheet_slide_in.xml` / `_out.xml`, `res/values/styles.xml` (`ComponentBottomSheetBaseDialogTheme` `backgroundDimAmount` 0.4) |
| Shop sheet | translateY 100% → 0, 200 ms, accelerate-decelerate; out to 120% | `res/anim/shop_slide_in.xml`, `shop_slide_out.xml` |
| Path "START" tap → lesson | if `isCtaDelightSoundAndHapticsEligible`: after a 50 ms start delay, the popover scales 1 → 4 over 220 ms with cubic (1,0,.85,1) while moving to the screen centre (delay 20, 200 ms, same curve). The title and subtitle fade out in 100 ms (linear). The button text fades out at 100 ms over 67 ms. A full-screen white layer fades in at 83 ms over 117 ms. Then a 1000 ms hold before the reset. Sound `cta_startlesson_release_swell_quiet` at volume 1.0 + haptic `CTA_BUTTON` | `src/p000/vqt.java:95-245`, `src/com/duolingo/home/path/PathFragment.java:429` |
| Session-end CTA | invisible until the animation ends, then alpha 0 → 1 in 500 ms (other screens: 300 ms delay first); taps blocked for 1000 ms | lesson-complete note §4 |

```css
/* challenge change, RTL (Qudrati) */
@keyframes chIn  {from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}}
@keyframes chOut {from{transform:none;opacity:1}to{transform:translateX(100%);opacity:0}}
.ch-enter{animation:chIn 500ms cubic-bezier(.4,0,.2,1) both}
.ch-leave{animation:chOut 500ms cubic-bezier(.4,0,.2,1) both}
/* bottom sheet */
@keyframes sheetIn{from{transform:translateY(20%);opacity:0}to{transform:none;opacity:1}}
.sheet{animation:sheetIn 250ms cubic-bezier(0,0,.2,1) both;border-radius:16px 16px 0 0}
.scrim{background:rgb(0 0 0 / .4)}
/* splash -> lesson */
@keyframes zoomIn{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
```

#### 1.5 Answering: select, check, feedback

| Step | What happens | Source |
|---|---|---|
| Pick an option | The option is a `ClickableCard` (border 2, lip 4, radius 16, padding 16). When selected: face `juicyIguana` #DDF4FF, border and lip `juicyBlueJay` #84D8FF, text `juicyMacaw` #1CB0F6. The colours change instantly. Pressing it gives the `KEYBOARD_TAP` haptic | `src/com/duolingo/core/design/juicy/ui/CardView.java:200-204`, `res/values/styles.xml` (`SelectableOutlineButton`) |
| Tap tokens | `tap_token_press_a_27` / `tap_token_press_c_27` (0.12 s) | `src/p000/fe9.java:1438-1461` |
| CHECK | `submitButton`, `SolidGreenButton` (#58CC02 face / #58A700 lip). Label `button_submit` "CHECK" / ar «تحقّق» | `res/layout/view_challenge_buttons.xml`, `res/values-ar/strings.xml` |
| Grading sound | `f8i` case 8 picks the sound: correct → `CORRECT` (`right_answer.mp3`, 1.17 s); wrong → `INCORRECT` (`wrong_answer.mp3`, 1.04 s). On a 5 / 10 / perfect-lesson combo, the correct sound becomes `correct_answer_5_in_a_row_lightning` / `_10_` / `_perfect_lesson_` (1.53 / 1.55 / 2.22 s). Playback volume of this one was **not traced**. Element-level wrong taps play `INCORRECT` at **0.5** | `src/p000/f8i.java:162-220`, `src/p000/szi.java:149`, `src/p000/le1.java:100`, `src/com/duolingo/session/challenges/ElementFragment.java:1256` |
| Ribbon slides in | Compose `GradingRibbon` (GradingRibbon.kt). A transition value animates 1 → 0 (hidden → shown) with `tween(300)`, or `tween(220)` when an internal flag (`z24`, not identified) is set. The easing is the Compose default, FastOutSlowIn (.4,0,.2,1) [platform]. `f8i` case 7 turns that value into a vertical offset of the ribbon's height, so the ribbon rises from below the screen | `src/p000/zyc.java:717-805`, `src/p000/f8i.java` case 7 |
| Ribbon content | icon `grading_check` (26 dp circle `juicyTreeFrog` #58A700, white check) or `grading_x` (26 dp `juicyFireAnt` #EA2B2B, white X, stroke 3.43). The title is picked at random (§5). The continue button is `continueButtonGreenStub` (SolidGreenButton), `continueButtonRedStub` (SolidRedButton #FF4B4B / #EA2B2B) or `continueButtonYellowStub` (#FFC800 / #E7A601, "speak softer"), each with margin-top 16. Ribbon kinds: CORRECT, INCORRECT, SOFT_INCORRECT, COMBO_RUN (combo-run button #00B3FC / #009CDC) | `res/drawable/grading_check.xml`, `grading_x.xml`, `res/layout/view_challenge_buttons.xml`, `src/com/duolingo/session/grading/GradingRibbonShowType.java`, `src/p000/e2n.java`, `res/values/colors.xml` (`comboRun*`) |
| Correct "explosion" | Rive `cadelight_grlighting_v08.riv` plays over the ribbon (`m7e`, one-shot, `start_trig`; bools `blue_bool`, `lightning_bool`, `dark_mode_bool`, `alignment_ref_bool`). Artboards: `smallExplosion_artboard` 375×230 (`explosionSmall` 1000 ms) and `largeExplosion_artboard` 375×340 (`explosion` 2000 ms). Style per `GradingRibbonExplosionStyle` SMALL / LARGE_V2. Older `cadelight_grlighting_v07.riv` (`j7e`): `small_explosion` 717 ms, `big_explosion` 1000 ms | `src/p000/m7e.java`, `src/p000/j7e.java`, `src/com/duolingo/data/session/grading/GradingRibbonExplosionStyle.java`, `res/raw/cadelight_grlighting_v0{7,8}.riv` |
| Option sparkles | `ButtonSparklesView` plays two Lotties at the card's corners: `button_sparkle_down_right.json` (90×72) and `button_sparkle_up_left.json` (132×80), 850 ms each (frames 31-82). They are used in `view_challenge_card`, `fragment_match` and the speak button | `src/com/duolingo/core/design/juicy/challenge/ButtonSparklesView.java:114-120`, `res/layout/view_stub_button_sparkles.xml` |
| Wrong answer motion | **No shake was found on lesson answers.** `res/animator/shake.xml` (translationX 0 → 15 → −12 → 9 → −6 → 0 dp, 5 × 85 ms = 425 ms) is used only by stroke tracing (`src/p000/qt2.java:121`). A wrong answer is told by colour, the red ribbon and the sound | — |
| Wrongly tapped option | `ChallengeOptionView.m10657j`: the option flashes red and fades back together over **500 ms** (`config_longAnimTime`, ValueAnimator default AccelerateDecelerate [platform]): face #FFDFE0 → #FFFFFD, lip #F5A4A4 → #E5E5E5, text #FF4B4B → #E5E5E5, so it ends greyed out | `src/com/duolingo/session/challenges/ui/ChallengeOptionView.java:69-240` |
| Match pairs | each correct pair plays `match_correct_a_a_0N` (0.38 s) with N = min(pairs matched so far, 5): tones 1-5 rise. A wrong pair plays `match_incorrect` | `src/com/duolingo/core/audio/MatchSound.java`, `src/p000/b48.java:81-96` |
| Combos | `lightning_32.riv` (inputs `5_combo_bool`, `10_combo_bool`, `perfect_lesson_bool`, `energy_end_X/Y_num`, `right_to_left_bool` …) with haptic `LIGHTNING_COMBO_5/10/PERFECT_LESSON`; the CTA flashes `cta_lightning_09.riv` (`small_lightning` 1000 ms, `big_lightning` 1333 ms); Duo "wabing" `duo_juicier_5_in_row_wabing` / `_10_in_row_wabing_v2` at 0.5 | `src/p000/ofn.java:60-100`, `src/p000/e8q.java:47-50` |

```css
/* answer card states */
.opt{background:#fff;border:2px solid #e5e5e5;border-bottom-width:4px;border-radius:16px;padding:16px;margin-top:8px}
.opt.sel{background:#ddf4ff;border-color:#84d8ff;color:#1cb0f6}
/* ribbon */
@keyframes ribbonUp{from{transform:translateY(100%)}to{transform:none}}
.ribbon{animation:ribbonUp 300ms cubic-bezier(.4,0,.2,1) both}
/* Duolingo's shake (exists in the app; used for tracing, not for lesson answers) */
@keyframes duoShake{0%{transform:none}20%{transform:translateX(15px)}40%{transform:translateX(-12px)}
  60%{transform:translateX(9px)}80%{transform:translateX(-6px)}100%{transform:none}}
.shake{animation:duoShake 425ms linear}
```

#### 1.6 Lesson progress bar

- **Fill.** Each change animates from the old fraction to the new one over **400 ms with Overshoot (tension 2) after a 200 ms delay**. The delay is `config_mediumAnimTime` when the view is not attached. Source: `src/p000/kcw.java:140-205`.
- **Start width.** The bar never starts empty. It starts at 2 × `duoSpacing16` = **32 dp**, unless an experiment sets an initial percent (`LessonProgressBarAndroidView.java:156`).
- **Size.** 16 dp tall, with 16 dp margins each side inside the header (`res/layout/activity_session.xml`).
- **Colour by combo** (`ProgressBarStreakColorState`; `src/com/duolingo/data/session/progressbar/model/ProgressBarStreakColorState.java`), tweened with an ObjectAnimator (default 300 ms [platform]):

  | State | Colour |
  |---|---|
  | 0 (room temperature) | owl #58CC02 |
  | 3 (warm), 4 (hot) | bee #FFC800 |
  | 5 (burning) | fox #FF9600 |
  | blue gradient (combo run) | #00FFFC → #268AFF linear |

- **Label pop.** A text label over the bar pops 0 → 1 with Overshoot (l.233-238).
- **Shine.** 25% of the bar height, offset 2 dp, inset 4 dp each side (l.193-198).
- **Current build.** The bar is Rive `in_lesson_pb_012.riv`. Artboard `template_artboard` takes `progress_num`, `bar_height_num`, `combo_lost_trig`, `dark_mode_bool`, `start_progress_bar_bool`, and `color_gradients` has `right_to_left_bool` (`src/p000/jy90.java:102`, `k9n.java:44`, `l9n.java:94`).
- **Perfect run.** `perfect_session_progress_bar_sparkles.json` (884×392, 1533 ms) plays over the bar (`res/layout/activity_session.xml`).
- **Quitting** plays loss-aversion sounds: `lossaversion_swing_pt1/pt2` and `lossaversion_poofb_alt_pt1/pt2`. The bar plays `progress_bar_loss_aversion_poof.json` (483 ms) and `_sparkles.json` (500 ms). Sources: `src/com/duolingo/data/session/progressbar/SessionQuitSoundEffect.java`, `AbstractC3021a.java:77-170`.

```js
// exact Android OvershootInterpolator(2)
const overshoot = t => { t -= 1; return t * t * (3 * t + 2) + 1; };
bar.animate([{width: from + '%'}, {width: to + '%'}],
  {duration: 400, delay: 200, fill: 'forwards',
   easing: 'linear(0,.233,.433,.603,.744,.859,.951,1.021,1.072,1.106,1.125,1.132,1.128,1.116,1.099,1.078,1.056,1.035,1.017,1.005,1)'});
```

#### 1.7 Numbers counting up

| Where | How | Source |
|---|---|---|
| Lesson-complete stat card (legacy) | pop scale 0.25 → 1 + alpha in 175 ms, then the ticker rolls from 0 in **300 ms**, then 100 ms delay + 175 ms colour-in. Bonus rows wait 600 ms, cross-fade 175 ms, re-tick 300 ms. Shine 900 ms | `src/com/duolingo/sessionend/sessioncomplete/ShortLessonStatCardView.java:243-500` |
| Lesson-complete stat card (Rive) | the number starts at +417 ms in each card (`xp_num_start_event`); the haptic ticks while it counts | lesson-complete note §2a, §3 |
| Leaderboard rank | the rank counts down during the 1000 ms move: `new + trunc((1−f)·(old−new))`; a tick sound per place on a cosine schedule | leaderboard note §3b, §3d |
| Streak | the Rive odometer `q2_26_streak_odometer_refresh_db_v17.riv` (`odo_db_trig`); the last digit plays `scroll_odometer_final_number` | `src/com/duolingo/streak/StreakIncreasedHeaderRedesignView.java:365`, `StreakSoundEffect.java` |
| Generic ticker | `AnimatedTickerView` (Compose). Its timing was not extracted | `src/com/duolingo/core/ticker/AnimatedTickerView.java` |

#### 1.8 Celebrations: which file plays when

| Moment | File (res/raw) | Size / length | Played by |
|---|---|---|---|
| Lesson complete hero | `lesson_complete_main_29.riv` | see note | `src/p000/vi00.java:56` |
| Lesson complete stats | `stat_component_72_lc_refresh.riv` | see note | `src/p000/li00.java:185` |
| Lesson complete characters | `session_complete_*_duo.riv`, `duo_perfect_*`, `duo_normal_*` (Lottie) | — | `src/com/duolingo/data/sessionend/SessionCompleteAnimation.java`, `.../SessionCompleteCharacterAnimation.java` |
| Stats sparkles | `session_complete_stats_sparkles.json` | 80×80, 1383 ms | `src/p000/p7s.java:460` |
| Correct answer burst | `cadelight_grlighting_v08.riv` | 1000-2000 ms | §1.5 |
| Combo lightning | `lightning_32.riv`, `cta_lightning_09.riv`, `lightning_cta_07.riv` | 917-2250 ms anims | `ofn`, `uv3`, `gg9` |
| "N in a row" coach | `streakmidlesson_xinarow_31.riv` | — | `src/com/duolingo/session/LessonCoachFragment.java:556` |
| Delightful text slam | `delightful_text_32.riv` (`slam_on` 333 ms, `3_slamIn_SOLO` 500 ms) | 375×375 | `src/p000/idu.java:38` |
| Perfect-run bar | `perfect_session_progress_bar_sparkles.json` | 884×392, 1533 ms | `activity_session.xml` |
| Quest bar full / partial | `perfect_session_progress_bar_sparkles` / `progress_bar_particle_yellow.json` | 1500 ms | `src/com/duolingo/goals/tab/ChallengeProgressBarView.java:275, 669` |
| Path node complete | `node_and_ring_119.riv` (`node_complete_trig`) + `node_complete.mp3` | see path note | `src/p000/xbs.java:23-24` |
| Path legendary sparkle | `legendary_skill_sparkles.json` | 312×312, 2917 ms | `src/com/duolingo/feature/home/SparklingAnimationView.java:38` |
| Streak flame | `se_streakflame_*.riv` (classic, perfect, freeze, milestone, immersive) | — | `src/p000/x850.java:26-41` |
| Streak calendar day | `streak_calendar_day_flame_pop.json` (30 fps, 633 ms), `streak_calendar_day_pulse.json` (1533 ms), coin `calendar_streak_coinflip_012.riv` | — | `CalendarDayView$Animation.java:49-56`, `src/p000/a150.java:1301` |
| Gems reveal | `gems_reveal_v14.riv` | — | `src/p000/p8i.java:47` |
| Chest | `chest_reveal_state_machines_with_color.riv`; `chest_open_sparkles.json` (135×88, 650 ms) | — | `src/com/duolingo/core/rewards/ChestRewardView.java:144`, `src/p000/z3q.java:85` |
| Leaderboard | glow + sparkles drawn in code | 300 up / 1000 down | leaderboard note §3e |

Pattern: every celebration is one authored file plus one matching sound plus one matching haptic, all fired together, and the CTA comes last.

#### 1.9 Reduced motion

Performance mode (`mgu.m38211b()`) does three things:
- skips the challenge slide (`SessionActivity.java:884`);
- skips the leaderboard animations;
- puts the Rive scenes in their static or `skip_anim` states (lesson-complete note §4).

Onboarding drops its slides, bubble pop and typing in the same mode (onboarding note §3).

---

### 2. Sound

**Player.**
- Sounds play through a SoundPool wrapper: `vo30.m48880b(sound, volume)` (left = right), or `us1.mo3163b(sound, l, r, loop)`, where loop −1 = repeat. Sources: `src/p000/vo30.java:26`, `src/p000/cg9.java`.
- Most game sounds play at **0.5**. The path CTA sounds play at **1.0**. The perfect-lesson fanfare plays at 1.0 (lesson-complete note §3).
- Lengths below were measured with ffprobe on the files.

| Moment | Enum → file | Length | When / volume | Source |
|---|---|---|---|---|
| Correct answer | `SoundEffects$SOUND.CORRECT` → `right_answer.mp3` | 1.17 s | on grading, with the ribbon | `src/com/duolingo/core/audio/SoundEffects$SOUND.java`, `src/p000/f8i.java:201` |
| Wrong answer | `INCORRECT` → `wrong_answer.mp3` | 1.04 s | on grading; element-level wrong taps at 0.5 | same; `ElementFragment.java:1256` |
| Neutral (skip / can't speak) | `NEUTRAL` → `neutral_answer.mp3` | 0.91 s | 0.5 | `src/p000/n2d.java:149` |
| 5 / 10 in a row, perfect | `CORRECT_5_IN_A_ROW_LIGHTNING`, `CORRECT_10_…`, `CORRECT_PERFECT_LESSON_LIGHTNING` | 1.53 / 1.55 / 2.22 s | replaces the correct sound | `f8i.java:190-196` |
| Duo combo cheer | `ML_5_IN_ROW_WABING`, `ML_10_IN_ROW_WABING_2` | 2.14 s | 0.5 | `src/p000/e8q.java:47-50` |
| Token tap | `TAP_TOKEN_PRESS_A_27` / `_C_27` | 0.12 s | word-bank taps | `src/p000/fe9.java:1438-1461` |
| Match pair | `MatchSound.CORRECT_TONE_1…5`, `INCORRECT` | 0.38 / 0.37 s | rising per pair | `src/p000/b48.java` |
| "Previous mistakes" segment | `PREVIOUS_MISTAKES_PRIMER` → `lesson_segment_primer_sfx.mp3` | 2.06 s | 0.5 + haptic | `src/p000/yi5.java:412-413` |
| Lesson complete | `FINISHED` → `lesson_complete.mp3` | 2.38 s | 0.5 at session end | `src/p000/x710.java:62`, `s5v.java:203` |
| Perfect lesson | `SE_PERFECT_LESSON` → `lessoncomplete_perfectlesson_finalaudio.mp3` | 4.47 s | 1.0 | `x710.java:62`, `SessionEndFragment.java:141` |
| Stat cards | `SE_STATS_1/2/3` → `se_stats_audio_1/2/3.mp3` | 0.82 s | one per card, 0.5 | `src/p000/oj00.java:77-91` |
| Lesson failed | `FAILED` → `lesson_failed.mp3` | 2.79 s | 0.5 | `src/com/duolingo/sessionend/LessonFailFragment.java:53` |
| Unit check failed | `UNIT_CHECK_IN_FAILED` → `session_stats_unit_check_in_fail.mp3` | 2.01 s | — | `x710.java:60` |
| Quit (loss aversion) | `SessionQuitSoundEffect.SWING_EXIT/RESUME`, `POOF_EXIT/RESUME` → `lossaversion_swing_pt1/2`, `lossaversion_poofb_alt_pt1/2` | 2.73 / 1.84 s | quit sheet | `SessionQuitSoundEffect.java` |
| Path node press | `CtaDelightSoundEffect.NODE_PRESS_QUIET` → `cta_node_press_quiet.wav` | 0.02 s | 1.0, on press-down, + haptic `CTA_NODE_PRESS` | `src/p000/cg9.java:23-24` |
| Path node release (popover opens) | `NODE_RELEASE_POPUP_QUIET` → `cta_node_release_popup_quiet.wav` | 0.17 s | 1.0 + haptic `CTA_NODE_RELEASE` | `cg9.java:30-31` |
| Popover close | `NODE_RELEASE_POPUP_CLOSE_QUIET` → `cta_release_popup_close_quiet.wav` | 0.10 s | 1.0 + `CTA_NODE_RELEASE` | `cg9.java:37-38` |
| Popover open (loop) | `SPARKLE_LOOP_QUIET` → `cta_sparkleloop_quiet.mp3` | 32.1 s | 1.0, loop −1, after the expand animator ends; stopped on close | `src/p000/p1u.java:74`, `PathPopupActionView.java:175` |
| Start lesson | `START_LESSON_RELEASE_SWELL_QUIET` → `cta_startlesson_release_swell_quiet.mp3` | 2.59 s | 1.0 + haptic `CTA_BUTTON` | `src/p000/vqt.java:109-110` |
| Node complete (back on path) | `NodeFlipSoundEffect.NODE_COMPLETE` → `node_complete.mp3` | 1.99 s | 1.0 + haptic `NODE_COMPLETE` | `src/p000/xbs.java:23-24` |
| Streak | `StreakSoundEffect`: CLASSIC_FLAME `streak_classic_flame` (4.96 s), MILESTONE_FLAME (6.01 s), PERFECT_FLAME, COINFLIP `streak_coinflip` (2.06 s), ODOMETER_REFRESH_REGULAR/PERFECT/MILESTONE (2.19 s), SCROLL_ODOMETER_COMPLETE, THAW_FLAME, immersive variants | — | streak screen, paired with `StreakHaptics` of the same name | `src/com/duolingo/data/streak/animationassets/soundeffects/StreakSoundEffect.java`, `RiveStreakAnimationState.java:74-80` |
| Daily quest bar | `DailyQuestSoundEffect.BAR_COMPLETE_25/50/75/100`, `BAR_PARTIAL_25/50/75/100` | 0.84-2.04 s | by jump size; complete vs partial by whether it fills | `src/p000/l25.java:57-63` |
| Quest point / chest / gems | `QUEST_POINT` (1.12 s), `CHEST_OPEN`, `GEM_CHEST_POP`, `GEM_FLURRY_5` / `GEM_FLURRY_10` (≥10 gems) | — | — | `src/p000/dtt.java:89`, `j25.java:144`, `m95.java:590`, `qb4.java:62` |
| Tiered chest | `TieredChestSoundEffect`: CHEST_IDLE_HOP_1/2/3 (1.84 s), CHEST_UPGRADE_0, _1_2, _2_3, _3_4, CHEST_OPEN (4.10 s), CHEST_OPEN_WAITING | — | chest ceremony | `TieredChestSoundEffect.java` |
| Reward reveal | `RewardSoundEffect.SMALL_GEMS / MEDIUM_GEMS / LARGE_GEMS` (2.70 / 2.84 / 3.35 s), ENERGY_REWARD | — | by reward size | `src/p000/zg70.java:27-36` |
| XP boost | `XpBoostSoundEffect.XP_BOOST_1_5X / 2X / 3X` (2X 4.34 s) + haptic `ACTIVATION` | — | — | `src/p000/dhb0.java:24-39` |
| Leaderboard | `LeaderboardSoundEffect.CARD_UNLOCK` (0.56 s), `CARD_MOVEUP`, `TICKUP_01…15`, `CARD_LOCKIN_GOLD/GREY` | — | see leaderboard note §3d | `LeaderboardSoundEffect.java` |
| Onboarding | `onboarding_music_loop.ogg` (64.0 s) at 0.5, `onboarding_music_ending.ogg`, stingers `onboarding_*_v7_l3.ogg` | — | see onboarding note | `src/p000/l1t.java:88`, `cua0.java:79` |

There is **no generic button-click sound**. Ordinary buttons are silent and give only the `KEYBOARD_TAP` haptic. Sound marks only answers, rewards, path CTAs and celebrations.

---

### 3. Haptics

#### 3.1 How haptics are stored

**Three tiers per pattern.** Each pattern is an `xdj(level1, level2, level3)`, chosen by `HapticsSupportLevel` NONE / LEVEL1 / LEVEL2 / LEVEL3 (`src/p000/xdj.java`, `src/com/duolingo/core/haptics/HapticsSupportLevel.java`):
- `*_l1.hla`: JSON `{"Timings":[…],"Amplitudes":[…]}` with amplitudes 0 or 255 only (on/off phones).
- `*_l2.hla`: the same timings with graded amplitudes 1-255. This is Android's `VibrationEffect.createWaveform(timings, amplitudes, repeat=-1)`.
- `*_l3.ogg`: Ogg Vorbis with **3 channels and the tag `ANDROID_HAPTIC=1`**, so sound and haptic play from one file (checked with ffprobe on `cta_button_v3_l3.ogg`, `lessoncomplete_v6_l3.ogg`, `node_complete_l3.ogg`).

**System haptics.** `HapticFeedbackEffect` (`src/com/duolingo/core/androidx/view/haptics/HapticFeedbackEffect.java`):
- `KEYBOARD_TAP` (3): every CardView or JuicyButton press, tap tokens and keyboards.
- `VIRTUAL_KEY`: music keys.
- `CONFIRM` / `REJECT` / `CLOCK_TICK`: flashcard correct / incorrect / move-on (`src/com/duolingo/core/session/haptics/FlashcardRiveHaptic.java`).

**No answer haptic found.** I found no haptic tied to an ordinary lesson answer being graded correct or incorrect. The session haptics are combos, lesson complete, energy and primers only.

#### 3.2 Pattern table

On (amplitude) in the l2 file: `start+length@amp` (ms, amplitude 0-255). Web pattern = the l1 file as on/off milliseconds for `navigator.vibrate`.

| Enum (class) | When | File | l2 waveform | Web pattern (l1) |
|---|---|---|---|---|
| `CTA_BUTTON` (CtaDelightHaptics) | path START → lesson | `cta_button_v3` | 0+30@179, 134+30@166, 164+451@77 (615 ms) | `[30,104,481]` |
| `CTA_NODE_PRESS` | path node press | `cta_node_press_v3` | 0+30@128 | `[30]` |
| `CTA_NODE_RELEASE` | node release / popover close | `cta_node_release_v3` | 0+45@153 | `[45]` |
| `NODE_COMPLETE` (NodeFlipHaptics) | node complete on the path | `node_complete` | 0+30@89, 388+250@89, 1136+30@204, 1222+30@153 (1252 ms) | `[30,358,250,498,30,56,30]` |
| `LIGHTNING_COMBO_5` (SessionHaptics) | 5 in a row | `lightning_5inarow_v4` | 0+31@128, 76+149@77, 380+30@128, 420+149@77 | `[31,45,149,155,30,10,149]` |
| `LIGHTNING_COMBO_10` | 10 in a row | `lightning_10inarow_v4` | 0+31@179, 46+120@77, 313+38@179, 391+200@77 | `[31,15,120,147,38,40,200]` |
| `LIGHTNING_PERFECT_LESSON` | perfect lesson | `lightning_perfect_v4` | 0+79@77, 79+88@128, 203+89@102, 292+147@179, 539+100@153, 639+150@77, 789+149@38 | `[79,20,64,36,90,20,129,100,250]` |
| `LESSON_COMPLETE` (legacy) | session end | `lessoncomplete_v2` | three beats of 430@64 rumble + 30@230 tap, at 0 / 901 / 1902 | `[430,60,30,381,430,60,30,481,430,60,30]` |
| `LESSON_COMPLETE_STAT_BUBBLES` / `_REFRESH` | stat cards | `lesson_complete_stats__v6` = `lessoncomplete_v6` | tick at 0; rumble 80-330@89; seven 30 ms ticks @217 at 501, 601, 698, 765, 801, 865, 933; tick at 1097; rumble 1127-1539@64; tick at 1599@230; rumble 1770-2200; tick at 2260@230 | `[30,50,250,171,30,70,30,67,30,37,30,6,30,34,30,38,30,134,442,60,30,141,430,60,30]` |
| `LESSON_COMPLETE_PERFECT_DUO_FLYING` | perfect lesson hero | `perfect_lesson_duo_v2` | 0+200@64, 225+300@64, 806+400@89, 1226+70@204, 1311+20@179, 1346+20@179, 1381+60@204 | `[200,25,300,504,267,15,20,15,20,15,60]` |
| `PREVIOUS_MISTAKES_PRIMER` | "previous mistakes" segment | `lesson_segment_primer_v3/v4` | three soft swells of 20 ms pulses (500-1700 ms) | `[0,301,57,32,36]` |
| `MID_LESSON_ENERGY_*` | energy charge / collect / flying | `mle_*_v2` | collect: 0+30@232, 60+30@93, 120+30@232 | collect `[30,30,30,30,30]` |
| `PROGRESS_BAR_30/60/100` (DailyQuestHaptics) | quest bar ends <60 / <100 / 100% | `dq_progressbar_*` | 0+430@26/38/64 rumble, 445+30@153/191/255 tap, 505+236@64/89/120 (same shape, stronger) | `[430,15,30,30,236]` |
| `GEM_FLURRY` | gem flurry | `dq_gem_flurry_v2` | 20 taps of 30 ms, soft (31-64) then strong (204-230) from 547 ms | see file |
| `PICK_UP` / `SINGLE_MOVE` / `MOVE_UP` / `DROP_OFF` (LeaderboardHaptics) | climb | `lb_*` | see leaderboard note §3b, §3d | — |
| `CLASSIC` / `MILESTONE` / `COINFLIP` / `CHECKMARK` / `ODOMETER_REFRESH` … (StreakHaptics) | streak screen | `streak_classic_v3`, `coinflip_lvl*`, `streak_odometer` … | classic: 23+146@51, 554+407@89, 961+245@143, 1349+150@230, 1499+748@128 | classic `[0,23,146,385,652,143,150,100,338]` |
| `CHEST_OPEN` (TieredChestHaptics) | chest opens | `rewardv2_chestopen_v3` | 0+500@77, 550+800@179 | `[500,50,800]` |
| `CHEST_IDLE_OPTION_1…3` | chest hops | `rewardv2_chest1idleoption*` | 0+100@77 | `[100]` |
| `SMALL / MEDIUM / LARGE_GEMS_REWARD_SHOWN` (RewardHaptics) | gems revealed | `rewardv2_*_gems_v1` | small: 0+100@128, then 4 taps of 30 ms at 150 / 230 / 310 / 390; large: 0+200@191, 700+260@102, 1000+30@204, 1130+30@153 | small `[100,50,30,50,30,50,30,50,30]` |
| `ACTIVATION` (XpBoostHaptics) | XP boost | `xp_boost_activation` | 2796 ms; ends with six 30 ms taps @230 every 60 ms and a 70 ms tap | see file |
| `WELCOME_PART1-3`, `LESSON_INTRO`, `OUTRO_PROFILE` (OnboardingHaptics) | first run | `onboarding_*_v7` | see onboarding note §3 | e.g. lesson intro `[50,50,350,50,50,40,50]` |
| `POOF_*` / `SWING_*` (SessionQuitHaptics) | quit sheet | `lossaversion_*` | swells of 20 ms pulses | — |

Sources: `src/com/duolingo/core/session/haptics/SessionHaptics.java`, `src/com/duolingo/home/path/soundeffects/CtaDelightHaptics.java`, `NodeFlipHaptics.java`, `src/com/duolingo/sessionend/goals/dailyquests/DailyQuestHaptics.java`, `src/com/duolingo/leagues/audiohaptic/LeaderboardHaptics.java`, `src/com/duolingo/data/streak/animationassets/soundeffects/StreakHaptics.java`, `src/com/duolingo/feature/tieredchest/soundeffects/*/`, `src/com/duolingo/core/xpboost/XpBoostHaptics.java`; waveforms from `res/raw/*_l1.hla` and `*_l2.hla`, parsed with a script.

**Patterns.** Haptics follow the beats of the sound and animation: a soft rumble for anticipation (amplitude 26-89), then a short hard tap (30 ms at 191-255) on the impact. Taps are almost always 30 ms. Bigger rewards use the same shape at a higher amplitude (quest bar 30 / 60 / 100).

```js
// web: play the l1 pattern; amplitude cannot be set (Android Chrome only; iOS Safari has no vibrate)
const HAPTIC = {
  nodePress:[30], nodeRelease:[45], ctaButton:[30,104,481],
  nodeComplete:[30,358,250,498,30,56,30],
  combo5:[31,45,149,155,30,10,149], combo10:[31,15,120,147,38,40,200],
  questBar:[430,15,30,30,236], chestOpen:[500,50,800],
};
const buzz = k => { try { navigator.vibrate && navigator.vibrate(HAPTIC[k]); } catch (e) {} };
```

---

### 4. Screen patterns

#### 4.1 Shared primitives

| Element | Spec | Source |
|---|---|---|
| Side gutter | 16 dp (`duoSpacing16`) on every screen | `res/values/dimens.xml`; all layouts below |
| Primary button | `TransparentButton` base: full width, **min height 52**, radius 16, padding 16 left/right, one line, drawable gap 8. Solid variants add lip 4 | `res/values/styles.xml` |
| Button stack | primary margin 16 all round; secondary below it with margin-bottom 16 and margin 16 left/right | `res/layout/view_onboarding_buttons.xml` |
| Card | `_BaseCard` from OutlineButton: padding 16, min width 48, border 2 #E5E5E5, lip 4, radius 16 | `res/values/styles.xml` |
| Safe areas | screens anchor to `systemStatusBarBottom` / `systemNavigationBarTop` guidelines (`@layout/system_bar_guidelines`); the bottom button sits 16 dp above the nav bar | `res/layout/activity_session.xml`, `fragment_prior_proficiency.xml` |

#### 4.2 Lesson / challenge screen

```
┌────────────────────────────────────────────┐  status bar (guideline)
│ [⚙/✕ 32]  ════ progress 16 tall ════  ♥ 5   │  header: padding 16, height ≈ 64 (headerPlaceholder 64)
├────────────────────────────────────────────┤
│  NEW WORD (indicator, mb 12)                │  element container: padding 16 left/right,
│  Instruction — H1 25sp bold, ×1.2           │  margin-bottom 16 above the button area
│  prompt (mt 16)                             │
│  ┌──────────────┐ options: ClickableCard,   │
│  │ option        │ mt 8 each                │
│  └──────────────┘                           │
│                                             │
│ [tip/skip] [          CHECK            ]    │  buttons: padding 16 left/right, 16 bottom;
└────────────────────────────────────────────┘  secondary OutlineButton at the start, 16 gap
```

| Part | Spec | Source |
|---|---|---|
| Header row | horizontal LinearLayout, padding 16, margin-bottom −16 (overlaps the content) | `res/layout/activity_session.xml` |
| Header contents | quit / settings icon 32×32 → `LessonProgressBarView` (weight 1, height 16, margin 16 each side) → hearts (`LimitedHeartsView`, margin-start 4, 5 hearts) | same |
| Instruction | `challengeInstruction` style H1 (25 sp bold, line spacing ×1.2); optional `ChallengeIndicatorView` above it (margin-bottom 12) | `res/layout/view_challenge_header.xml` |
| Prompt and answers | `prompt` margin-top 16; `selection` margin-top 16, fills the rest | `res/layout/fragment_select.xml` |
| Option | `ClickableCard`, margin-top 8 | `res/layout/view_challenge_option.xml` |
| Content padding | `challengeElementContainerPadding` = 16; the content stops 16 dp above an invisible "fake button" (margin 16 top and bottom), which reserves the button area | `res/layout/fragment_challenge_container.xml` |
| CHECK | `submitButton` width 0 (fills), `SolidGreenButton`; optional secondary buttons (tip, calculator, keyboard toggle) as `OutlineButton`, wrap width, margin-end 16 | `res/layout/view_challenge_buttons.xml` |
| After grading | CHECK is replaced by CONTINUE (green / red / yellow stub, margin-top 16); optional "Explain my answer" / "Show me how" / "Undo" buttons above it, margin-top 16 | same |

#### 4.3 Feedback sheet (grading ribbon)

- **Built in Compose** (`com.duolingo.data.session.grading.GradingRibbon`, `GradingRibbonActionButtons`; trace strings in `src/p000/zyc.java`). Its paddings live in Compose code and were not extracted.
- **What is known.**
  - It covers the button area and rises from below (§1.5).
  - It has a 26 dp check or X icon, a random title (§5), the coloured CONTINUE button, and optional action buttons RATING / REDO / REPORT (`src/com/duolingo/session/grading/GradingRibbonButton.java`).
  - The CORRECT burst plays over it.
- **Colours.** The button colours are the 01-tokens pairs. The ribbon's own background colour was not extracted. Combo run uses the blue set (#A8FFFE, #38EEFF, #00E7FF, #009DDC; `src/p000/e2n.java:280-345`).

#### 4.4 Session-end screens

See `Duolingo Study/notes/duolingo-lesson-complete-spec.md` §2b for the full spec. The parts that repeat across session-end screens:
- The hero takes the top 45% of the screen.
- Title 32 sp bold, line height 36, gold #FFC800, margin 16.
- Subtitle 19 sp #AFAFAF, margin-top 8, margin 24 each side.
- Stat row margin-top 40.
- CTA container 16 dp from the edges, `invisible` until the animation is done.

#### 4.5 Home path

See `duolingo-home-path-spec.md`:
- Top bar 48 dp.
- Sticky unit header.
- Nodes 70×57 with an 8 dp lip, zig-zag offsets.
- Tooltip bounce 8 dp per 1000 ms.
- Popover full width minus 64.
- Tab bar 86 dp with a 2 dp top border.

#### 4.6 Bottom sheet

| Part | Spec | Source |
|---|---|---|
| Sheet | white (`juicySnow`), top corners 16 | `res/drawable/bottom_sheet_rounded_corners.xml` |
| Grabber | 37×6 pill #AFAFAF, margin-top 6, margin-bottom 14 | `res/drawable/bottom_sheet_grabber.xml`, `res/layout/bottom_sheet_streak_freeze_used.xml` |
| Content | title H1, margin 16 top / 8 bottom, 20 left/right; body; primary button margin-top 32, 20 left/right; secondary `TransparentButton` margin 16 top and bottom, 20 left/right | `bottom_sheet_streak_freeze_used.xml` |
| Window | edge-to-edge, scrim 0.4, peek height 900 (opens fully) | `res/values/styles.xml` (`AppBottomSheetDialogTheme`, `ComponentBottomSheetBaseDialogTheme`, `AppModalStyle`) |
| Motion | in 250 ms / out 200 ms (§1.4) | — |

#### 4.7 Onboarding question screen

- **Two layouts.** See `duolingo-onboarding-study.md` §3:
  - Duo on the side when a question is asked: 40% of the width, bubble at his end side, max 232.
  - Duo on top with the bubble when he only talks.
- **Spacing.** The options sit in a scroll view with padding 8 top and 16 left/right. Option cards are `ClickableCard`s with margin-bottom 12. The button bar is `OnboardingButtonsView`: an optional 2 dp divider bar, the primary button (`SolidGreenButton`, margin 16) and the secondary `TransparentGreenButton`. Sources: `res/layout/fragment_welcome_coach.xml`, `fragment_welcome_fork.xml`, `view_onboarding_buttons.xml`.
- **Timing.** The bubble pops at 300 ms over 250 ms. Typing runs at 10 ms per character. The options arrive 800 ms after the last character, sliding in over 400 ms.

---

### 5. Voice and tone of the copy

| Item | English | Arabic (values-ar) | Source |
|---|---|---|---|
| Check | CHECK | تحقّق | `res/values*/strings.xml` `button_submit` |
| Continue | CONTINUE | المتابعة | `button_continue` |
| Skip | SKIP | تَخَطَّ | `button_skip` |
| Correct titles (one at random) | Good job! / Nicely done! / Correct! / Excellent! / Awesome! / Nice! / Amazing! / Great job! / Nice job! / Great! | أحسنت عملًا! / أحسنت عملًا! / صحيح! / ممتاز! / رائع! / رائع! / مذهل! / عمل رائع! / عمل جيد! / عظيم! | `src/p000/y1n.java:42` (the list), `res/values-ar/strings.xml` `grade_correct_*` |
| Wrong title | Incorrect (also "Not quite" in some flows); "Common mistake!" when a smart tip shows | غير صحيح | `y1n.java:792-914` |
| Solution label | Correct Answer: / Another correct solution: | — | `correct_answer`, `grade_another_correct_solution` |
| Path tooltip | START / CONTINUE / JUMP HERE? | ابدأ / المتابعة / القفز إلى هنا؟ | home-path note §3 |

Patterns:
1. Buttons are one verb in ALL CAPS (`LabelMedium` is caps with letter-spacing 0.04).
2. Feedback titles are two or three words with an exclamation mark, picked at random from a pool so they do not repeat.
3. A wrong answer is stated plainly ("Incorrect"), never scolding. The help goes in the solution line.
4. Celebration headlines name what the learner did (perfect, fast, first lesson; lesson-complete note §2c).
5. Stat labels only flatter.

---

### 6. Not found or not traced

- The playback volume of the main grading sound (`right_answer` / `wrong_answer` via `szi.f157403B` → `le1` → `w60` case 2). Element-level wrong taps are 0.5.
- The grading ribbon's internal paddings, its title text size, and the flag that picks 220 ms over 300 ms (`z24` in `zyc.java`).
- A shake or bounce on wrong lesson answers: none found. A haptic tied to grading correct or incorrect in ordinary lessons: none found.
- `AnimatedTickerView`'s roll timing (Compose, `s180.m45011m`).
- Hearts losing a heart: `LimitedHeartsView` is a plain LinearLayout with no animation code. The animation, if any, lives elsewhere and was not found.
- The `0.5` / `1.0` volume rule is from call sites. No central volume table exists.
- The Android platform durations (200 / 400 / 500) and the default interpolators are framework values, not APK contents.
