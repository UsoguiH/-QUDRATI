#!/usr/bin/env node
/* «أسئلة قدرات كمي مع طريقة الحل» — qudrat-methods.html.

   The page is built with the lesson pages, by tools/build_lesson_pages.js, because
   the two share one rule: every bank question is shown on one page only, and each
   lesson's section links to its own page (qudrat/<slug>.html). This command is kept
   so the old habit still works; it runs the same build and writes every page.

       node tools/build_methods_page.js            # same as: node tools/build_lesson_pages.js
       node tools/build_methods_page.js --check    # writes nothing; exits 1 if out of date

   Run it after any change to a lesson's title, rules, tricks or questions. Never
   hand-edit the output. */
"use strict";
require("child_process").execFileSync(process.execPath, [require("path").join(__dirname, "build_lesson_pages.js"), ...process.argv.slice(2)], { stdio: "inherit" });
