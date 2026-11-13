# Exercise: Bike Cards That Fit Anywhere

Exercise code for the lesson **Exercise: Bike Cards That Fit Anywhere** in CSS in Depth on [ask-codey.com](https://www.ask-codey.com).

Spoke & Chain is a made-up bike shop, and its catalog page shows the same bike card in three kinds of spots: a wide "Bike of the month" spot, a three-column catalog and a narrow "Staff pick" sidebar. Right now a media query puts every card side by side on a wide screen, so the cards in the narrow spots get crushed. You'll make each card fit its own space with container queries, and give the card title a fluid size with `clamp()`, in `styles.css`. Tests check each part.

## What's here

- `index.html`: the page, with five cards, each inside a `<div class="card-spot">`. Ready to use: you don't need to change it.
- `styles.css`: the stylesheet. The colors, fonts, page layout and the card's stacked look are ready. The comment at the top lists your work, for you to finish below the line that says *Yours: cards that fit their space*, and the media query marked *The problem* is for you to delete.
- `images/`: a picture of each bike. Ready to use.
- `page.test.js` and `package.json`: the tests that check your styles, and the list of what they need. You don't need to change these.

## Run it

Open the folder in VS Code, right-click `index.html` and choose **Open with Live Server**. The page reloads every time you save `styles.css`.

## Check your work

In VS Code, open a terminal (**Terminal > New Terminal**), and run this once, to download what the tests need:

```bash
npm install
```

Then run the tests, as often as you like:

```bash
npm test
```

At first almost every test fails: that is expected. Only the first one passes, because it checks the page that's already there. Each part you add turns its test green. A failing test's message says what it found and what to fix, for example: *The spot holding the Gravel Fox card has container-type: normal. Give .card-spot container-type: inline-size, so a container query can measure its width.*

The tests read your rules, but they can't see the page or measure a container: the browser they use doesn't lay out pages. Check how it looks with the checklist below too.

## What to do

1. **Make every spot a container.** Give `.card-spot` a container type that measures its width, `inline-size`, and the container name `bike-spot`.
2. **Delete the problem.** Delete the media query marked *The problem* near the end of `styles.css`. It asks how wide the screen is, when what matters is how wide each card's spot is.
3. **Side by side when there's room.** Write an `@container bike-spot` rule that gives `.bike-card` two columns with `grid-template-columns`, photo on the left and words on the right, once the spot is wide enough. Pick the width yourself, somewhere from `26rem` to `34rem`: look at where the stacked card starts to look empty.
4. **A look for the wide spot.** After that rule, write a second `@container bike-spot` rule, at least `8rem` wider, that gives a card in a wide spot its own look: more padding, a bigger gap, a different split between the photo and the words, bigger text in the blurb. Your choice.
5. **A fluid title.** Give `.bike-card-title` a font size with `clamp()`: a minimum and a maximum in rem, and a preferred size that mixes rem and `cqi`, such as `0.75rem + 3cqi`, so each title grows with its own card's space. Write it after the ready `.bike-card-title` rule.

## How it should look

Use the developer tools' device mode, or drag the browser window, to check each width:

- [ ] **A phone, 375 pixels wide:** every card is stacked, photo on top.
- [ ] **A tablet, about 768 pixels wide:** the bike of the month and the staff pick (now below the catalog, full width) are side by side; the catalog's cards, two to a row, are stacked.
- [ ] **A laptop, 1280 pixels wide or more:** the bike of the month has its wide-spot look; the three catalog cards and the staff pick in the sidebar are stacked, with nothing crushed.
- [ ] Every card title is bigger in a wide spot than in a narrow one, and none of them wraps one word per line.
- [ ] In the Elements panel, each `.card-spot` has a **container** badge beside it.
- [ ] With the page zoomed to 200%, the card titles get bigger.

## The rules

- Change only `styles.css`.
- Keep the page layout's media queries (for `.page` and `.catalog`). They're about the screen, and that's the right tool for them.
- No media query may change the card or anything inside it.

## Tips

- A container query styles what's inside the container, never the container itself. That's why each card sits in a `.card-spot`: the spot is measured, and the card changes.
- `container: bike-spot / inline-size;` sets the name and the type in one line, if you prefer it.
- When two `@container` rules both match a wide spot, the later one wins where they disagree, so the wider rule goes second.
- Not sure which width to pick? Inspect a spot: the size shown when you hover it in the Elements panel is the container's width.
- A test message names the value it read. Look for that property in the Styles pane of the developer tools.

## Hand it in

When it works, put your solution in a public repo of your own on GitHub, then paste that repo's address into **Submit your exercise** on the lesson page at [ask-codey.com](https://www.ask-codey.com). That's what completes the lesson. You don't need Git: create the repo on GitHub, choose **Add file**, then **Upload files**, and upload everything in this folder except `node_modules` (it's the files `npm install` downloaded, far too many for GitHub's upload, and `npm install` makes it again). The lesson page shows each step, and the lesson *Put Your Page Online for Free* walks through every screen.
