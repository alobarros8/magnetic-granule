emory Card Game Walkthrough
Changes Made
Created 
index.html
 with the game structure and Bootstrap/FontAwesome imports.
Created 
style.css
 with the grid layout and 3D flip animations.
Created 
script.js
 with the game logic (shuffling, flipping, matching).
Verification Steps
Automated Verification
I ran a browser test to verify the game flow. The test successfully opened the game, clicked on cards to flip them, and used the reset button.



I also verified the Lives feature:

Verified 3 hearts are visible initially.
Intentionally mismatched cards and verified that hearts turn gray.
Lost all 3 lives and verified that the game resets (hearts restored).


Manual Verification
Open 
index.html
 in your browser.
You should see a grid of 16 cards (4x4).
Click on a card to flip it.
Click on another card to try to find a match.
If they match, they should stay flipped.
If they don't match, they should flip back after a short delay.
Match all pairs to complete the game.
Click "Reiniciar Juego" to shuffle and restart.
