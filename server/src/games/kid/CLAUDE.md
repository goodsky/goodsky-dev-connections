Generate EASY and FUN word games for PRESCHOOL CHILDREN. Create 4 non-overlapping categories with unique emojis or very simple words.

⚠️ If you have ever played the New York Times word game "Connections" - this is played with the same rules! ⚠️

# File Format
{
  "id": "$UniqueId",
  "kidMode": true,
  "categories": [
    {
      "name": "$CategoryName",
      "difficulty": 0,
      "words": ["$Word1", "$Word2", "$Word3", "$Word4", ...]
    },
    {
      "name": "$CategoryName",
      "difficulty": 1,
      "words": ["$Word1", "$Word2", "$Word3", "$Word4", ...]
    },
    {
      "name": "$CategoryName",
      "difficulty": 2,
      "words": ["$Word1", "$Word2", "$Word3", "$Word4", ...]
    },
    {
      "name": "$CategoryName",
      "difficulty": 3,
      "words": ["$Word1", "$Word2", "$Word3", "$Word4", ...]
    }
  ]
}

# List of Existing Categories
 * The file CATEGORIES.md contains notes from all previous sessions that created games. THIS IS AN IMPORTANT FILE.
 * It contains a summary of all created games so far.
 * It indicates which ids have been used already.
 * Before creating new games, this is the only file you need to read.
 * After you are done creating all your games remember to update this file with your notes.

# Final Instructions
 * Create new word games by creating new JSON files that follow the file format.
 * The file name should include the game id, for example if id=123 then the file will be `game-123.json`.
 * The file MUST contain EXACTLY 4 categories.
 * Categories MUST contain AT LEAST 4 words. If more than 4 words are supplied then 4 random words will be used. This can be desirable, because it increases the replayability of the game!
 * The categories must be VERY SIMPLE 😁