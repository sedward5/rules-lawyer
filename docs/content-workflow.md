# Content workflow

## The repository is canonical

The Workshop can hold an in-progress copy in browser local storage, but the repository is the source of truth. Browser storage can be cleared and does not sync between devices.

## Review a batch on iPhone

1. Open `workshop.html` on the deployed site.
2. Paste a JSON batch into **Import questions**. You can also load the starter example.
3. Select each question from the queue.
4. Read the scenario, proposed answer, explanation, references, and editorial briefing.
5. Correct the fields in the editor.
6. Set content status and rules verification independently.
7. Use **Player preview** to judge whether the puzzle is clear and fun.
8. Export. The Workshop validates the structure, copies JSON to the clipboard, and downloads a backup file.
9. In GitHub's mobile website or app, edit the corresponding batch file and replace its contents with the exported JSON.
10. Commit. Reload the Workshop to confirm the repository copy is current.

## Important browser behavior

- Local draft storage is per browser and device.
- Importing replaces the current in-memory working batch.
- Export validates the batch before downloading.
- Clipboard access generally requires HTTPS (GitHub Pages is HTTPS).
- The Workshop does not authenticate to GitHub and cannot commit changes.
- Do not rely on local storage as a backup.

## Before approving

- Check that the scenario includes every relevant game-state assumption.
- Check the answer against the current official rules.
- Verify every rule reference and rules version.
- Check that the explanation describes the sequence correctly.
- Confirm exactly one answer is correct.
- Check distractors for ambiguity.
- Ensure the player-facing experience is concise.
- Have a qualified judge independently review complicated or uncertain questions.

## Daily selection behavior

Only approved and rules-verified questions are eligible. Eligible questions are sorted by ID, then selected with a stable hash of the UTC date. Adding or removing questions can change future assignments, so avoid changing the approved pool casually once the game is public.
